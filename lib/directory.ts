import { notFound } from "next/navigation";
import { database } from "./session";
export type DirectoryKind = "members" | "categories";
export type DirectoryRecord = {
  id: string;
  name: string;
  active: boolean;
  revision: number;
  inactive_reason: string | null;
  phone?: string | null;
  group_name?: string | null;
  member_number?: string;
};

export async function readRecord(
  kind: DirectoryKind,
  id: string,
): Promise<DirectoryRecord> {
  if (!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) notFound();
  const db = await database();
  const { data, error } = await db
    .from(kind)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("The record could not be loaded.");
  if (!data) notFound();
  return data;
}
