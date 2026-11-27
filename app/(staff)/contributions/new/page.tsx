import { database, requireStaff } from "@/lib/session";
import { choices, receipt } from "@/lib/collections";
import { CollectionForm } from "./form";
import { today } from "@/lib/money";
import { notFound } from "next/navigation";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ replace?: string }>;
}) {
  const { replace } = await searchParams;
  const original = replace ? await receipt(replace) : null;
  if (original?.collection_voids) notFound();
  const db = await database();
  const dues = [];
  for (let start = 0; ; start += 500) {
    const { data, error } = await db
      .from("dues_balances")
      .select("id,member_id,category_id,currency,due_date,outstanding")
      .order("id")
      .range(start, start + 499);
    if (error) throw Error("Unable to load obligations");
    dues.push(...data);
    if (data.length < 500) break;
  }
  return (
    <>
      <h1>
        {original ? "Correct " + original.receipt : "Record contribution"}
      </h1>
      <CollectionForm
        owner={(await requireStaff()).id}
        options={await choices()}
        dues={dues}
        original={original}
        date={today()}
      />
    </>
  );
}
