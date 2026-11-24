import Link from "next/link";
import { expense } from "@/lib/expenses";
import { money } from "@/lib/money";
import { database } from "@/lib/session";
import { Controls } from "./controls";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params,
    e = await expense(id),
    db = await database();
  const files = await db.storage
    .from("expense-evidence")
    .list(id, { limit: 1000 });
  if (files.error) throw Error("Expense evidence unavailable");
  const replacement = await db
    .from("expenses")
    .select("id")
    .eq("replaces", id)
    .maybeSingle();
  return (
    <>
      <Link href="/expenses">Expenses</Link>
      <h1>{e.description}</h1>
      <section className="panel">
        <h2>{money(e.currency, e.amount)}</h2>
        <p>
          {e.payee} · {e.business_date} · {e.method}
        </p>
        <p>
          {e.category}
          {e.project_label && " · " + e.project_label}
        </p>
        <p>Recorded by {e.officer}</p>
        {e.expense_voids ? (
          <p className="alert">VOID · {e.expense_voids.reason}</p>
        ) : (
          <Link href={"/expenses/new?replace=" + id}>Correct expense</Link>
        )}
        {e.replaces && (
          <p>
            <Link href={"/expenses/" + e.replaces}>Original expense</Link>
          </p>
        )}
        {replacement.data && (
          <p>
            <Link href={"/expenses/" + replacement.data.id}>
              Replacement expense
            </Link>
          </p>
        )}
        <h2>Evidence</h2>
        {files.data.map((f) => (
          <p key={f.name}>
            <a
              href={
                "/expenses/" +
                id +
                "/evidence?file=" +
                encodeURIComponent(f.name)
              }
            >
              {f.name.split("~").at(-1)}
            </a>
          </p>
        ))}
        <Controls id={id} active={!e.expense_voids} />
      </section>
    </>
  );
}
