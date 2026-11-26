import { RegisterHead, registerOrder, SortFields } from "../register-order";
import { FilterForm } from "@/app/submit-button";
import Link from "next/link";
import { database } from "@/lib/session";
import { choices } from "@/lib/collections";
import { money } from "@/lib/money";
const columns = [
  { label: "Receipt" },
  { label: "Date", field: "business_date" },
  { label: "Payer", field: "payer" },
  { label: "Amount", field: "total", money: true },
  { label: "Status" },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const f = await searchParams,
    db = await database(),
    options = await choices();
  const n = Math.max(1, Math.min(100000, parseInt(f.page) || 1));
  const order = registerOrder(columns, f, "business_date", true);
  const query = db
    .from("collections")
    .select(
      "id,receipt,business_date,payer,currency,total,method,collection_voids(collection_id),allocations!inner(category_id)",
    );
  if (columns.some((column) => column.field === order.field && column.money)) query.order("currency");
  query.order(order.field, { ascending: !order.descending }).order("receipt", { ascending: false });
  if (f.from) query.gte("business_date", f.from);
  if (f.to) query.lte("business_date", f.to);
  if (f.currency) query.eq("currency", f.currency);
  if (f.method) query.eq("method", f.method);
  if (f.member) query.eq("member_id", f.member);
  if (f.category) query.eq("allocations.category_id", f.category);
  if (f.q)
    query.ilike(
      f.q.toUpperCase().startsWith("CBC-") ? "receipt" : "payer",
      "%" + f.q + "%",
    );
  const { data, error } = await query.range((n - 1) * 25, n * 25);
  if (error) throw Error("Unable to load contributions");
  const href = (page: number) =>
    "/contributions?" + new URLSearchParams({ ...f, page: String(page) });
  return (
    <>
      <div className="title-row">
        <h1>Contributions</h1>
        <Link className="action" href="/contributions/new">
          Record contribution
        </Link>
      </div>
      <section className="directory">
        <FilterForm className="filters" label="Filter" busyLabel="Filtering…" hint="Apply these filters to the contributions register.">
          <SortFields order={order} />
          <label>
            Payer or receipt
            <input name="q" defaultValue={f.q} />
          </label>
          {["from", "to"].map((k) => (
            <label key={k}>
              {k === "from" ? "From" : "To"}
              <input type="date" name={k} defaultValue={f[k]} />
            </label>
          ))}
          {Object.entries({
            currency: ["USD", "LRD"],
            method: options.methods,
            category: options.categories,
            member: options.members,
          }).map(([k, items]) => (
            <label key={k}>
              {k}
              <select name={k} defaultValue={f[k]}>
                <option value="">All</option>
                {items.map((it) =>
                  typeof it === "string" ? (
                    <option key={it}>{it}</option>
                  ) : (
                    <option key={it.id} value={it.id}>
                      {it.name}
                    </option>
                  ),
                )}
              </select>
            </label>
          ))}
        </FilterForm>
        <div
          className="table-scroll"
          role="region"
          aria-label="contributions table"
          tabIndex={0}
        >
          <table>
            <RegisterHead columns={columns} query={f} order={order} path="/contributions" />
            <tbody>
              {data.slice(0, 25).map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link href={"/receipts/" + r.id}>{r.receipt}</Link>
                  </td>
                  <td>{r.business_date}</td>
                  <td>{r.payer}</td>
                  <td className="amount-cell">{money(r.currency, r.total)}</td>
                  <td>{r.collection_voids ? "Void" : "Posted"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.length && <p className="empty">No matching contributions.</p>}
        <div className="pages">
          {n > 1 && <Link href={href(n - 1)}>Previous</Link>}
          {data.length > 25 && <Link href={href(n + 1)}>Next</Link>}
        </div>
      </section>
    </>
  );
}
