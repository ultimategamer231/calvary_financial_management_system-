import { choices } from "@/lib/collections";
import { expense } from "@/lib/expenses";
import { today } from "@/lib/money";
import { ExpenseForm } from "../form";
import { notFound } from "next/navigation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ replace?: string }>;
}) {
  const { replace } = await searchParams;
  const original = replace ? await expense(replace) : null;
  if (original?.expense_voids) notFound();
  const o = await choices();
  return (
    <>
      <h1>{original ? "Correct expense" : "Record expense"}</h1>
      <ExpenseForm
        methods={o.methods}
        projects={o.categories}
        original={original}
        date={today()}
      />
    </>
  );
}
