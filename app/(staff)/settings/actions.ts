"use server";
import { database, requireStaff } from "@/lib/session";
import { revalidatePath } from "next/cache";
export async function saveSetting(_prev: string, form: FormData) {
  await requireStaff();
  const field = (k: string) => String(form.get(k) ?? "").trim();
  const db = await database();
  const op = field("operation");
  let error;
  if (op === "profile") {
    ({ error } = await db
      .from("church_profile")
      .update({
        name: field("name"),
        address: field("address"),
        phone: field("phone"),
      })
      .eq("id", true));
  } else if (op === "add") {
    ({ error } = await db
      .from("payment_methods")
      .insert({ name: field("method") }));
  } else if (op === "method") {
    ({ error } = await db
      .from("payment_methods")
      .update({ active: field("active") === "true" })
      .eq("name", field("method")));
  } else return "Unknown setting.";
  if (error)
    return "Unable to save. Check the values and any duplicate method name.";
  revalidatePath("/settings");
  return "Changes saved.";
}
