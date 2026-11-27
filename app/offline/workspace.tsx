"use client";
import { useEffect, useState } from "react";
import {
  items,
  lease,
  read,
  type Options,
  type Item,
} from "@/lib/offline-browser";
import { money, today } from "@/lib/money";
import { CollectionForm } from "../(staff)/contributions/new/form";
import { OfflineStatus } from "./status";

export function OfflineWorkspace() {
  const [owner, setOwner] = useState("");
  const [options, setOptions] = useState<Options>();
  const [records, setRecords] = useState<{ id: string; item: Item }[]>([]);
  const [editing, setEditing] = useState<{ id: string; item?: Item }>();
  const [message, setMessage] = useState("");
  useEffect(() => {
    let live = true,
      previous = "",
      generation = 0;
    async function refresh() {
      const seq = ++generation;
      const active = lease()?.owner ?? "";
      if (previous !== active) {
        previous = active;
        setOwner(active);
        setEditing(undefined);
        setOptions(undefined);
        setRecords([]);
      }
      if (!active) return;
      try {
        const [data, saved] = await Promise.all([
          read<Options>(active, "options"),
          items(active),
        ]);
        if (live && seq === generation && lease()?.owner === active) {
          setOptions(data ?? undefined);
          setRecords(saved);
        }
      } catch {
        if (live) setMessage("Browser storage could not be read.");
      }
    }
    void refresh();
    function guard() {
      if ((lease()?.owner ?? "") !== previous) void refresh();
    }
    const timer = setInterval(guard, 500);
    for (const event of [
      "calvary-storage",
      "storage",
      "focus",
      "pageshow",
      "calvary-status",
    ])
      window.addEventListener(event, refresh);
    return () => {
      live = false;
      clearInterval(timer);
      for (const event of [
        "calvary-storage",
        "storage",
        "focus",
        "pageshow",
        "calvary-status",
      ])
        window.removeEventListener(event, refresh);
    };
  }, []);
  const sums = new Map<string, bigint>();
  for (const { item } of records)
    if (item.entry && item.state !== "draft") {
      const { currency, total } = item.entry;
      sums.set(currency, (sums.get(currency) ?? 0n) + BigInt(total));
    }
  if (!owner)
    return (
      <p>
        Offline entry is locked. <a href="/login">Sign in online</a> to access
        your saved work.
      </p>
    );
  return (
    <>
      <OfflineStatus owner={owner} />
      {message && <p role="status">{message}</p>}
      <p>
        <a href="/dashboard">Staff dashboard</a>
      </p>
      <button
        className="secondary"
        onClick={() => {
          document.cookie =
            "calvary-device=locked; Path=/; Max-Age=31536000; SameSite=Lax";
          document.cookie = "calvary-offline=; Path=/; Max-Age=0; SameSite=Lax";
          window.dispatchEvent(new Event("calvary-status"));
        }}
      >
        Lock offline collections
      </button>
      <h2>Saved on this device</h2>
      {records.length === 0 && <p>No saved collections.</p>}
      {Array.from(sums, ([c, total]) => (
        <p key={c}>Awaiting posting · {money(c, total)}</p>
      ))}
      <ul>
        {records.map(({ id, item }) => (
          <li key={id}>
            {item.draft.fields.date} ·{" "}
            {item.draft.kind === "member"
              ? options?.members.find((m) => m.id === item.draft.member)?.name
              : item.draft.kind === "guest"
                ? item.draft.fields.guest
                : "Anonymous"}{" "}
            ·{" "}
            {item.entry && <>{money(item.entry.currency, item.entry.total)} · </>}
            {item.state === "pending"
              ? "Waiting to sync"
              : item.state === "review"
                ? "Needs review · Check the member, allocations and payment method"
                : "Unfinished draft"}
            {item.state !== "pending" && !editing && (
              <button onClick={() => setEditing({ id, item })}>
                Open entry
              </button>
            )}
          </li>
        ))}
      </ul>
      {!options ? (
        <p>Connect to prepare collection entry.</p>
      ) : editing ? (
        <CollectionForm
          key={editing.id}
          owner={owner}
          offlineId={editing.id}
          initial={editing.item?.draft}
          options={options}
          original={null}
          date={today()}
          dues={[]}
          onSaved={() => {
            setEditing(undefined);
            setMessage(
              "Saved on this device. Confirmed collections leave the queue automatically.",
            );
          }}
        />
      ) : (
        <button
          onClick={() => {
            setMessage("");
            setEditing({ id: crypto.randomUUID() });
          }}
        >
          Record contribution
        </button>
      )}
    </>
  );
}
