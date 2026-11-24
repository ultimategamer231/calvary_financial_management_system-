"use server";
import { database, requireStaff } from "@/lib/session";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/database.types";
export async function post(key: string, entry: Json) {
  await requireStaff();
  const db = await database();
  const { data, error } = await db.rpc("post_collection", {
    request_key_input: key,
    entry,
  });
  if (error)
    return "Unable to post. Check the amounts, selected records and correction status, then retry.";
  revalidatePath("/contributions");
  redirect("/receipts/" + data);
}
export async function voidReceipt(
  id: string,
  _previous: string,
  form: FormData,
) {
  await requireStaff();
  const reason = String(form.get("reason") ?? "").trim();
  if (!reason || reason.length > 300)
    return "Enter a reason of 1 to 300 characters.";
  const db = await database();
  const { error } = await db.rpc("void_collection", {
    target: id,
    explanation: reason,
  });
  if (error) return "Unable to void. Refresh and check the receipt status.";
  revalidatePath("/receipts/" + id);
  redirect("/receipts/" + id);
}
