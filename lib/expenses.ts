import { database } from "./session";
import { notFound } from "next/navigation";
export async function expense(id: string) {
  if (!/^[\da-f-]{36}$/i.test(id)) notFound();
  const db = await database();
  const { data, error } = await db
    .from("expenses")
    .select("*,expense_voids(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw Error("Unable to load expense");
  if (!data) notFound();
  return data;
}
