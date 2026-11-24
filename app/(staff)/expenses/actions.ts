"use server";
import { requireStaff, database } from "@/lib/session";
import { minor } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
export async function saveExpense(
  key: string,
  replaces: string,
  _prev: string,
  form: FormData,
) {
  await requireStaff();
  const fields = Object.fromEntries(
    [...form.entries()].map(([k, v]) => [k, String(v).trim()]),
  );
  const amount = minor(fields.amount);
  if (!amount) return "Enter a positive amount with up to two decimal places.";
  const db = await database();
  const r = await db.rpc("post_expense", {
    request_key_input: key,
    entry: { ...fields, amount: String(amount), replaces },
  });
  if (r.error)
    return "Expense could not be posted. Check the fields and correction status.";
  revalidatePath("/expenses");
  redirect("/expenses/" + r.data);
}
export async function voidExpense(id: string, _prev: string, form: FormData) {
  await requireStaff();
  const db = await database();
  const r = await db.rpc("void_expense", {
    target: id,
    explanation: String(form.get("reason") ?? "").trim(),
  });
  if (r.error) return "Unable to void expense. Check the reason and status.";
  revalidatePath("/expenses/" + id);
  return "Expense voided.";
}
export async function uploadEvidence(
  id: string,
  _prev: string,
  form: FormData,
) {
  await requireStaff();
  const file = form.get("file");
  if (!(file instanceof File) || file.size > 2 * 1024 * 1024 || !file.size)
    return "Select a PDF, JPEG or PNG file up to 2 MB.";
  const bytes = Buffer.from(await file.arrayBuffer());
  const type =
    bytes.subarray(0, 5).toString() === "%PDF-"
      ? "application/pdf"
      : bytes.subarray(0, 8).toString("hex") === "89504e470d0a1a0a"
        ? "image/png"
        : bytes.subarray(0, 3).toString("hex") === "ffd8ff"
          ? "image/jpeg"
          : null;
  if (!type) return "Unsupported file contents.";
  const db = await database();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return "Sign in again.";
  const name =
    file.name.replace(/[^A-Za-z0-9._-]/g, "_").slice(-90) || "evidence";
  const r = await db.storage
    .from("expense-evidence")
    .upload(
      id + "/" + user.id + "~" + crypto.randomUUID() + "~" + name,
      bytes,
      { contentType: type, upsert: false },
    );
  if (r.error) return "Upload failed. Your posted expense is saved.";
  revalidatePath("/expenses/" + id);
  return "Evidence attached.";
}
