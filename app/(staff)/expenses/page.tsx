import { RegisterHead, registerOrder, SortFields } from "../register-order";
import { FilterForm } from "@/app/submit-button";
import { database } from "@/lib/session";
import { money } from "@/lib/money";
import Link from "next/link";
const columns = [
  { label: "Description", field: "description" },
  { label: "Date", field: "business_date" },
  { label: "Payee", field: "payee" },
  { label: "Category", field: "category" },
  { label: "Amount", field: "amount", money: true },
  { label: "Status" },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const f = await searchParams;
  const n = Math.max(1, parseInt(f.page) || 1),
    db = await database();
  const order = registerOrder(columns, f, "business_date", true);
  const q = db
    .from("expenses")
    .select("*,expense_voids(expense_id)");
  if (columns.some((column) => column.field === order.field && column.money)) q.order("currency");
  q.order(order.field, { ascending: !order.descending }).order("id");
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
        <FilterForm className="filters" label="Filter" busyLabel="Filtering…" hint="Apply these filters to the expenses register.">
          <SortFields order={order} />
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
        </FilterForm>
        <div
          className="table-scroll"
          role="region"
          aria-label="expenses table"
          tabIndex={0}
        >
          <table>
            <RegisterHead columns={columns} query={f} order={order} path="/expenses" />
            <tbody>
              {data.slice(0, 25).map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link href={"/expenses/" + e.id}>{e.description}</Link>
                  </td>
                  <td>{e.business_date}</td>
                  <td>{e.payee}</td>
                  <td>{e.category}</td>
                  <td className="amount-cell">{money(e.currency, e.amount)}</td>
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
