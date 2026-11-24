import { Cancel } from "./cancel";
import { choices } from "@/lib/collections";
import { database } from "@/lib/session";
import { money, today } from "@/lib/money";
import { Assign } from "./form";
import Link from "next/link";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; member?: string }>;
}) {
  const { page, member } = await searchParams;
  const n = Math.max(1, parseInt(page ?? "1") || 1);
  const opts = await choices(),
    db = await database();
  const query = db
    .from("dues_balances")
    .select("*")
    .order("due_date")
    .order("id");
  if (member) query.eq("member_id", member);
  const { data, error } = await query.range((n - 1) * 25, n * 25);
  if (error) throw Error("Cannot load commitments");
  const url = (i: number) =>
    "/dues?" + new URLSearchParams({ page: String(i), member: member ?? "" });
  return (
    <>
      <h1>Dues &amp; commitments</h1>
      <Assign members={opts.members} categories={opts.categories} />
      <section className="directory">
        <form className="filters">
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
          <button>Filter</button>
        </form>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                {[
                  "Member",
                  "Commitment",
                  "Due date",
                  "Assigned",
                  "Paid",
                  "Outstanding",
                  "Status",
                  "Action",
                ].map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
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
                    <td key={i}>{money(o.currency!, v!)}</td>
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
