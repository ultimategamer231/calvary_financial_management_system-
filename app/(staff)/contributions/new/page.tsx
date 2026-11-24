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
  return (
    <>
      <h1>
        {original ? "Correct " + original.receipt : "Record contribution"}
      </h1>
      <CollectionForm
        options={await choices()}
        original={original}
        date={today()}
      />
    </>
  );
}
