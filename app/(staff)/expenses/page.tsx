import { database } from "@/lib/session";
import { money } from "@/lib/money";
import Link from "next/link";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const f = await searchParams;
  const n = Math.max(1, parseInt(f.page) || 1),
    db = await database();
  const q = db
    .from("expenses")
    .select("*,expense_voids(expense_id)")
    .order("business_date", { ascending: false })
    .order("id");
  if (f.from) q.gte("business_date", f.from);
  if (f.to) q.lte("business_date", f.to);
  if (f.category) q.ilike("category", "%" + f.category + "%");
  if (f.currency) q.eq("currency", f.currency);
  const { data, error } = await q.range((n - 1) * 25, n * 25);
  if (error) throw Error("Expenses unavailable");
  const url = (p: number) =>
    "/expenses?" + new URLSearchParams({ ...f, page: String(p) });
  return (
    <>
      <div className="title-row">
        <h1>Expenses</h1>
        <Link className="action" href="/expenses/new">
          Record expense
        </Link>
      </div>
      <section className="directory">
        <form className="filters">
          <label>
            From
            <input name="from" type="date" defaultValue={f.from} />
          </label>
          <label>
            To
            <input name="to" type="date" defaultValue={f.to} />
          </label>
          <label>
            Category
            <input name="category" defaultValue={f.category} />
          </label>
          <label>
            Currency
            <select name="currency" defaultValue={f.currency}>
              <option value="">All</option>
              <option>USD</option>
              <option>LRD</option>
            </select>
          </label>
          <button>Filter</button>
        </form>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Description",
                  "Date",
                  "Payee",
                  "Category",
                  "Amount",
                  "Status",
                ].map((s) => (
                  <th key={s}>{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 25).map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={"/expenses/" + e.id}>{e.description}</Link>
                  </td>
                  <td>{e.business_date}</td>
                  <td>{e.payee}</td>
                  <td>{e.category}</td>
                  <td>{money(e.currency, e.amount)}</td>
                  <td>{e.expense_voids ? "Void" : "Posted"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.length && <p className="empty">No matching expenses.</p>}
        <div className="pages">
          {n > 1 && <Link href={url(n - 1)}>Previous</Link>}
          {data.length > 25 && <Link href={url(n + 1)}>Next</Link>}
        </div>
      </section>
    </>
  );
}
