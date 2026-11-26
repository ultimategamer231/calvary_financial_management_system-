import { RegisterHead, registerOrder, SortFields } from "../register-order";
import { FilterForm } from "@/app/submit-button";
import { Cancel } from "./cancel";
import { choices } from "@/lib/collections";
import { database } from "@/lib/session";
import { money, today } from "@/lib/money";
import { Assign } from "./form";
import Link from "next/link";
const columns = [
  { label: "Member", field: "member_name" },
  { label: "Commitment", field: "category_label" },
  { label: "Due date", field: "due_date" },
  { label: "Assigned", field: "amount", money: true },
  { label: "Paid", field: "paid", money: true },
  { label: "Outstanding", field: "outstanding", money: true },
  { label: "Status" },
  { label: "Action" },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const f = await searchParams;
  const { page, member } = f;
  const n = Math.max(1, parseInt(page ?? "1") || 1);
  const opts = await choices(),
    db = await database();
  const order = registerOrder(columns, f, "due_date", false);
  const query = db
    .from("dues_balances")
    .select("*");
  if (columns.some((column) => column.field === order.field && column.money)) query.order("currency");
  query.order(order.field, { ascending: !order.descending }).order("id");
  if (member) query.eq("member_id", member);
  const { data, error } = await query.range((n - 1) * 25, n * 25);
  if (error) throw Error("Cannot load commitments");
  const url = (i: number) =>
    "/dues?" + new URLSearchParams({ ...f, page: String(i) });
  return (
    <>
      <h1>Dues &amp; commitments</h1>
      <Assign members={opts.members} categories={opts.categories} />
      <section className="directory">
        <FilterForm className="filters" label="Filter" busyLabel="Filtering…" hint="Apply these filters to the dues register.">
          <SortFields order={order} />
          <label>
            Member
            <select name="member" defaultValue={member}>
              <option value="">All</option>
              {opts.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </FilterForm>
        <div
          className="table-scroll"
          role="region"
          aria-label="dues table"
          tabIndex={0}
        >
          <table>
            <RegisterHead columns={columns} query={f} order={order} path="/dues" />
            <tbody>
              {data.slice(0, 25).map((o) => (
                <tr key={o.id}>
                  <td>{o.member_name}</td>
                  <td>
                    {o.category_label}
                    {o.group_label && " · " + o.group_label}
                  </td>
                  <td>{o.due_date}</td>
                  {[o.amount, o.paid, o.outstanding].map((v, i) => (
                    <td className="amount-cell" key={i}>{money(o.currency!, v!)}</td>
                  ))}
                  <td>
                    {!o.outstanding
                      ? "Paid"
                      : o.due_date! < today()
                        ? "Overdue"
                        : "Open"}
                  </td>
                  <td>{!o.paid && <Cancel id={o.id!} />}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.length && <p className="empty">No commitments assigned.</p>}
        <div className="pages">
          {n > 1 && <Link href={url(n - 1)}>Previous</Link>}
          {data.length > 25 && <Link href={url(n + 1)}>Next</Link>}
        </div>
      </section>
    </>
  );
}
