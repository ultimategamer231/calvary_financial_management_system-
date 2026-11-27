"use client";
import { useEffect, useState } from "react";
import {
  deliver,
  items,
  lease,
  lockLease,
  request,
  save,
} from "@/lib/offline-browser";

export function OfflineStatus({ owner }: { owner: string }) {
  const [message, setMessage] = useState("Preparing offline entry…");
  useEffect(() => {
    let live = true,
      running = false,
      prepared = 0,
      hadLease = false;
    const status = (s: string) => {
      if (live) setMessage(s);
    };
    async function tick() {
      if (!live || running) return;
      running = true;
      try {
        if (!("serviceWorker" in navigator) || !navigator.locks) {
          status("Offline entry unavailable in this browser.");
          return;
        }
        if (!prepared) {
          await navigator.serviceWorker.register("/offline-worker.js");
          await navigator.serviceWorker.ready;
        }
        if (navigator.onLine && Date.now() - prepared > 15 * 60000) {
          const response = await request("prepare");
          if ([401, 403].includes(response.status)) {
            lockLease(owner);
            status("Sign in again to enable offline entry.");
            return;
          }
          if (!response.ok) throw Error();
          const data = await response.json();
          if (!live || data.owner !== owner) return;
          await save(owner, "options", data.options);
          prepared = Date.now();
        }
        if (lease()?.owner !== owner) {
          status("Sign in online to unlock offline entry.");
          return;
        }
        hadLease = true;
        const records = await items(owner);
        const summary = (count: number) =>
          (navigator.onLine ? "Ready for offline use" : "Working offline") +
          (count ? " · " + count + " saved on this device" : "");
        status(summary(records.length));
        if (navigator.onLine)
          for (const { id, item } of records) {
            if (!live || lease()?.owner !== owner) return;
            if (item.state === "pending") {
              try {
                await deliver(owner, id);
              } catch {
                status(
                  "Saved on this device · Connection interrupted, retrying automatically",
                );
                return;
              }
            }
          }
        const count = (await items(owner)).length;
        status(summary(count));
      } catch {
        status(
          lease()?.owner === owner
            ? "Connection or storage unavailable · Check saved entries"
            : "Offline entry unavailable",
        );
      } finally {
        running = false;
      }
    }
    function checkAccess() {
      if (
        hadLease &&
        lease()?.owner !== owner &&
        location.pathname !== "/offline"
      ) {
        location.replace("/offline");
        return;
      }
    }
    function reconnect() {
      prepared = 0;
      void tick();
    }
    void tick();
    const sync = setInterval(tick, 30000);
    const guard = setInterval(checkAccess, 1000);
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", tick);
    window.addEventListener("focus", checkAccess);
    return () => {
      live = false;
      clearInterval(sync);
      clearInterval(guard);
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", tick);
      window.removeEventListener("focus", checkAccess);
    };
  }, [owner]);
  return (
    <p className="offline-status">
      <span aria-live="polite">{message}</span>
      {" · "}
      <a href="/offline">Offline collections</a>
    </p>
  );
}
