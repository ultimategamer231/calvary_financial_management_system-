"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { database, requireStaff } from "@/lib/session";
import type { DirectoryKind } from "@/lib/directory";

export async function saveRecord(
  kind: DirectoryKind,
  id: string | null,
  revision: number,
  previous: string,
  form: FormData,
): Promise<string> {
  await requireStaff();
  if (kind !== "members" && kind !== "categories") return "Unknown directory.";
  const field = (key: string) => String(form.get(key) ?? "").trim();
  const name = field("name"),
    extra = field("extra");
  const member = kind === "members";
  if (!name || name.length > 120)
    return "Enter a name of up to 120 characters.";
  if (extra.length > (member ? 40 : 80))
    return member
      ? "Phone must be 40 characters or fewer."
      : "Group must be 80 characters or fewer.";
  const active = field("status") !== "inactive";
  const reason = active ? null : field("reason");
  if (!active && (!reason || reason.length > 300))
    return "Enter a reason of up to 300 characters.";
  const db = await database();
  const state = { active, inactive_reason: reason };
  const mutation = id
    ? (member
        ? db.from("members").update({ name, phone: extra || null, ...state })
        : db
            .from("categories")
            .update({ name, group_name: extra || null, ...state })
      )
        .eq("id", id)
        .eq("revision", revision)
    : member
      ? db.from("members").insert({ name, phone: extra || null })
      : db.from("categories").insert({ name, group_name: extra || null });
  const result = await mutation.select("id").maybeSingle();
  if (result.error?.code === "23505")
    return "A category already uses that name.";
  if (result.error)
    return "The record could not be saved. Check the details and try again.";
  if (!result.data)
    return "Another staff member changed this record. Reload the page to review the latest details.";
  revalidatePath("/" + kind);
  if (member) revalidatePath("/members/" + result.data.id);
  redirect(
    member ? "/members/" + result.data.id + "?saved=1" : "/categories?saved=1",
  );
}
