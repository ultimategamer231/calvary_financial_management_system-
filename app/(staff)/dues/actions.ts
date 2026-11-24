"use server";
import { database, requireStaff } from "@/lib/session";
import { minor } from "@/lib/money";
import { revalidatePath } from "next/cache";
export async function assign(key: string, form: FormData) {
  await requireStaff();
  const amount = minor(String(form.get("amount")));
  if (!amount) return "Enter a positive amount with up to two decimals.";
  const members = form.getAll("members").map(String);
  if (!members.length) return "Select at least one member.";
  const db = await database();
  const { error } = await db.rpc("assign_dues", {
    batch_key: key,
    entry: {
      amount: String(amount),
      members,
      group: String(form.get("group") ?? ""),
      currency: String(form.get("currency")),
      category: String(form.get("category")),
      date: String(form.get("date")),
    },
  });
  if (error)
    return "Assignment could not be saved. Review the members, category and date.";
  revalidatePath("/dues");
  return "Assignment saved.";
}
export async function cancel(id: string, _prev: string, form: FormData) {
  await requireStaff();
  const db = await database();
  const r = await db.rpc("cancel_obligation", {
    target: id,
    explanation: String(form.get("reason") ?? ""),
  });
  if (r.error)
    return "Cancellation failed. Check the reason and linked payments.";
  revalidatePath("/dues");
  return "Cancelled.";
}
