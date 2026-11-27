"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import type { choices, receipt } from "@/lib/collections";
import { money, decimal, minor } from "@/lib/money";
import { post } from "../actions";
import {
  deliver,
  lease,
  read,
  save,
  type Draft,
  type Item,
} from "@/lib/offline-browser";
type Props = {
  owner: string;
  offlineId?: string;
  initial?: Draft;
  onSaved?: () => void;
  options: Awaited<ReturnType<typeof choices>>;
  original: Awaited<ReturnType<typeof receipt>> | null;
  dues: {
    id: string | null;
    member_id: string | null;
    category_id: string | null;
    currency: string | null;
    due_date: string | null;
    outstanding: number | null;
  }[];
  date: string;
};
export function CollectionForm({
  options,
  original,
  date,
  dues,
  owner,
  offlineId,
  initial,
  onSaved,
}: Props) {
  const [key] = useState(() => offlineId ?? crypto.randomUUID()),
    [kind, setKind] = useState(
      initial?.kind ?? original?.payer_kind ?? "member",
    ),
    [currency, setCurrency] = useState(
      initial?.currency ?? original?.currency ?? "USD",
    );
  const [member, setMember] = useState(
    initial?.member ?? original?.member_id ?? "",
  );
  const [lines, setLines] = useState(
    initial?.lines ??
      original?.allocations.map((l) => ({
        category: l.category_id,
        obligation: l.obligation_id ?? "",
        amount: decimal(l.amount),
      })) ?? [{ category: "", amount: "", obligation: "" }],
  );
  const [draft, setDraft] = useState<Record<string, string> | null>(null),
    [error, setError] = useState(""),
    [pending, start] = useTransition();
  const [fields, setFields] = useState(
    initial?.fields ?? {
      date: original?.business_date ?? date,
      method:
        original?.method ??
        (options.methods.includes("Cash")
          ? "Cash"
          : (options.methods[0] ?? "")),
      guest: original?.payer_kind === "guest" ? original.payer : "",
      notes: original?.notes ?? "",
      reference: original?.reference ?? "",
    },
  );
  const [touched, setTouched] = useState(false);
  const [writable, setWritable] = useState(!offlineId);
  const writes = useRef(Promise.resolve());
  const finished = useRef(false);
  useEffect(() => {
    if (!navigator.locks || original) return;
    let release: (() => void) | undefined,
      live = true;
    void navigator.locks
      .request("calvary-edit:" + key, { ifAvailable: true }, async (lock) => {
        if (!live) return;
        if (!lock) {
          setError("This entry is already open in another tab.");
          return;
        }
        const existing = initial ? await read<Item>(owner, key) : null;
        if (!live) return;
        if (
          initial &&
          (!existing ||
            existing.state === "pending" ||
            JSON.stringify(existing.draft) !== JSON.stringify(initial))
        ) {
          setError("This entry changed. Reopen it from the saved list.");
          return;
        }
        setWritable(true);
        await new Promise<void>((resolve) => {
          release = resolve;
        });
      })
      .catch(() => setError("Unable to unlock the saved entry."));
    return () => {
      live = false;
      release?.();
    };
  }, [offlineId, key, owner, initial, original]);
  useEffect(() => {
    if (
      !writable ||
      !touched ||
      original ||
      finished.current ||
      lease()?.owner !== owner
    )
      return;
    const snapshot = { fields, kind, currency, member, lines };
    writes.current = writes.current
      .then(() => save(owner, key, { state: "draft", draft: snapshot }))
      .catch(() =>
        setError(
          "Draft could not be saved on this device. Keep this screen open.",
        ),
      );
  }, [
    fields,
    kind,
    currency,
    member,
    lines,
    writable,
    touched,
    original,
    owner,
    key,
  ]);
  const total = lines.reduce((s, l) => s + (minor(l.amount) ?? 0n), 0n);
  function change(index: number, patch: Partial<(typeof lines)[number]>) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  return (
    <>
      <form
        className="panel record"
        hidden={!!draft || !writable}
        onChange={(e) => {
          setTouched(true);
          const input = e.target;
          if (
            !(
              input instanceof HTMLInputElement ||
              input instanceof HTMLSelectElement
            )
          )
            return;
          if (input.name && input.name !== "member")
            setFields((previous) => ({
              ...previous,
              [input.name]: input.value,
            }));
        }}
        onSubmit={(e) => {
          e.preventDefault();
          const fields = Object.fromEntries(
            new FormData(e.currentTarget),
          ) as Record<string, string>;
          if (lines.some((l) => !minor(l.amount)) || total > 99999999999999n) {
            setError(
              "Enter a positive amount with up to two decimal places for every allocation.",
            );
            return;
          }
          setError("");
          setDraft(fields);
        }}
      >
        <label>
          Contributor type
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {["member", "guest", "anonymous"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        {kind === "member" && (
          <label>
            Member
            <select
              name="member"
              required
              value={member}
              onChange={(e) => {
                setMember(e.target.value);
                setLines(lines.map((l) => ({ ...l, obligation: "" })));
              }}
            >
              <option value="">Choose member</option>
              {options.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind === "guest" && (
          <label>
            Guest name
            <input
              name="guest"
              required
              maxLength={160}
              defaultValue={fields.guest}
            />
          </label>
        )}
        <label>
          Business date
          <input name="date" type="date" defaultValue={fields.date} required />
        </label>
        <label>
          Currency
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setLines(lines.map((l) => ({ ...l, obligation: "" })));
            }}
          >
            <option>USD</option>
            <option>LRD</option>
          </select>
        </label>
        <label>
          Payment method
          <select name="method" defaultValue={fields.method}>
            {options.methods.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Allocations</legend>
          {lines.map((l, i) => (
            <div className="allocation" key={i}>
              <label>
                Category {i + 1}
                <select
                  required
                  value={l.category}
                  onChange={(e) =>
                    change(i, { category: e.target.value, obligation: "" })
                  }
                >
                  <option value="">Choose category</option>
                  {options.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Amount {i + 1}
                <input
                  required
                  inputMode="decimal"
                  value={l.amount}
                  onChange={(e) => change(i, { amount: e.target.value })}
                />
              </label>
              {kind === "member" && !offlineId && (
                <label>
                  Apply allocation {i + 1} to
                  <select
                    value={l.obligation}
                    onChange={(e) => change(i, { obligation: e.target.value })}
                  >
                    <option value="">Voluntary contribution</option>
                    {dues
                      .filter(
                        (d) =>
                          d.member_id === member &&
                          d.category_id === l.category &&
                          d.currency === currency &&
                          (d.outstanding ||
                            original?.allocations.some(
                              (a) => a.obligation_id === d.id,
                            )),
                      )
                      .map((d) => (
                        <option key={d.id} value={d.id!}>
                          {d.due_date} · {money(currency, d.outstanding!)}{" "}
                          outstanding
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {lines.length > 1 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setTouched(true);
                    setLines(lines.filter((_, n) => n !== i));
                  }}
                >
                  Remove allocation {i + 1}
                </button>
              )}
            </div>
          ))}
          {lines.length < 50 && (
            <button
              className="secondary"
              type="button"
              onClick={() =>
                setLines([
                  ...lines,
                  { category: "", amount: "", obligation: "" },
                ])
              }
            >
              Add allocation
            </button>
          )}
        </fieldset>
        <label>
          Reference (optional)
          <input
            name="reference"
            maxLength={160}
            defaultValue={fields.reference}
          />
        </label>
        <label>
          Notes (optional)
          <input name="notes" maxLength={600} defaultValue={fields.notes} />
        </label>
        {original && (
          <label>
            Correction reason
            <input name="reason" required maxLength={300} />
          </label>
        )}
        <button>Review contribution</button>
      </form>
      {draft && (
        <section className="panel">
          <h2>Review contribution</h2>
          <p>
            {kind === "member"
              ? options.members.find((m) => m.id === draft.member)?.name
              : kind === "guest"
                ? draft.guest
                : "Anonymous"}{" "}
            · {draft.date} · {draft.method}
          </p>
          {lines.map((l, i) => (
            <p key={i}>
              {options.categories.find((c) => c.id === l.category)?.name} —{" "}
              {money(currency, minor(l.amount)!)}{" "}
              {kind === "member" && l.obligation
                ? " · Assigned commitment"
                : ""}
            </p>
          ))}
          <p>
            <strong>Total {money(currency, total)}</strong>
          </p>
          {draft.reference && <p>Reference: {draft.reference}</p>}
          {draft.notes && <p>Notes: {draft.notes}</p>}
          {original && (
            <p>
              Replaces {original.receipt} · {draft.reason}
            </p>
          )}
          <div className="commands">
            <button
              disabled={pending}
              aria-busy={pending}
              title="Post the reviewed contribution and issue its receipt"
              onClick={() =>
                start(async () => {
                  const entry = {
                    ...draft,
                    kind,
                    currency,
                    total: String(total),
                    lines: lines.map((l) => ({
                      category: l.category,
                      obligation: kind === "member" ? l.obligation : "",
                      amount: String(minor(l.amount)),
                    })),
                    replaces: original?.id ?? "",
                  };
                  if (
                    !original &&
                    lease()?.owner === owner &&
                    (!entry.lines.some((l) => l.obligation) || navigator.onLine)
                  ) {
                    try {
                      await writes.current;
                      await save(owner, key, {
                        state: "pending",
                        draft: {
                          kind,
                          member,
                          currency,
                          fields: { ...fields, ...draft },
                          lines,
                        },
                        entry,
                      });
                      finished.current = true;
                    } catch {
                      setError(
                        "Could not save the contribution. Keep this screen open and retry.",
                      );
                      return;
                    }
                    let receipt: string | undefined;
                    if (navigator.onLine) {
                      try {
                        receipt = await deliver(owner, key);
                      } catch {
                        /* A retry uses the same request key. */
                      }
                    }
                    // A document navigation reaches the cached shell even when the Next router is offline.
                    if (onSaved) onSaved();
                    else {
                      const destination = receipt ? "/receipts/" + receipt : "/offline";
                      window.location.assign(destination);
                    }
                    return;
                  }
                  if (offlineId || !navigator.onLine) {
                    setError(
                      "Reconnect and verify your session to post this entry.",
                    );
                    return;
                  }
                  setError(await post(key, entry, owner));
                })
              }
            >
              {pending ? "Posting…" : "Post contribution"}
            </button>
            <button
              disabled={pending}
              className="secondary"
              onClick={() => setDraft(null)}
            >
              Back to edit
            </button>
          </div>
        </section>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
