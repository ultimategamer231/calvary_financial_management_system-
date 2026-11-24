import { database } from "@/lib/session";
import Link from "next/link";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const f = await searchParams,
    db = await database(),
    n = Math.max(1, Number(f.page) || 1);
  const q = db
    .from("audit_log")
    .select("*")
    .order("occurred_at", { ascending: false })
    .order("record_key");
  for (const key of ["actor", "entity", "action", "record_key"] as const)
    if (f[key]) q.ilike(key, "%" + f[key] + "%");
  if (f.from) q.gte("occurred_at", f.from + "T00:00:00Z");
  if (f.to) q.lte("occurred_at", f.to + "T23:59:59.999999Z");
  const { data, error } = await q.range((n - 1) * 25, n * 25);
  if (error) throw Error("Audit unavailable");
  const url = (p: number) =>
    "/audit?" + new URLSearchParams({ ...f, page: String(p) });
  return (
    <>
      <h1>Audit log</h1>
      <form className="filters">
        {Object.entries({
          actor: "Staff",
          entity: "Module",
          action: "Action",
          record_key: "Record ID",
          from: "From",
          to: "To",
        }).map(([k, l]) => (
          <label key={k}>
            {l}
            <input
              type={k === "from" || k === "to" ? "date" : "text"}
              name={k}
              defaultValue={f[k]}
            />
          </label>
        ))}
        <button>Filter</button>
      </form>
      <section className="directory">
        {data.slice(0, 25).map((r, i) => (
          <details className="audit-row" key={i}>
            <summary>
              {r.occurred_at?.slice(0, 19).replace("T", " ")} · {r.actor} ·{" "}
              <span>{r.entity}</span> · {r.action}
            </summary>
            <p>Record {r.record_key}</p>
            <h3>Before</h3>
            <pre>{JSON.stringify(r.before_record, null, 2)}</pre>
            <h3>After</h3>
            <pre>{JSON.stringify(r.after_record, null, 2)}</pre>
          </details>
        ))}
        {!data.length && <p className="empty">No matching events.</p>}
        <div className="pages">
          {n > 1 && <Link href={url(n - 1)}>Previous</Link>}
          {data.length > 25 && <Link href={url(n + 1)}>Next</Link>}
        </div>
      </section>
    </>
  );
}
