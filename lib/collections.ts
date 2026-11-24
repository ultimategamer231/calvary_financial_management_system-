import { notFound } from "next/navigation";
import { database } from "./session";
export async function receipt(id: string) {
  if (!/^[\da-f-]{36}$/i.test(id)) notFound();
  const db = await database();
  const result = await db
    .from("collections")
    .select("*, allocations(*), collection_voids(*)")
    .eq("id", id)
    .maybeSingle();
  if (result.error) throw Error("Unable to load receipt");
  if (!result.data) notFound();
  const replacement = await db
    .from("collections")
    .select("id,receipt")
    .eq("replaces", id)
    .maybeSingle();
  if (replacement.error) throw Error("Unable to load correction");
  return { ...result.data, replacement: replacement.data };
}
export async function choices() {
  const db = await database();
  const members: { id: string; name: string }[] = [],
    categories: { id: string; name: string }[] = [];
  for (const [table, target] of [
    ["members", members],
    ["categories", categories],
  ] as const) {
    for (let start = 0; ; start += 500) {
      const { data, error } = await db
        .from(table)
        .select("id,name")
        .eq("active", true)
        .order("name")
        .order("id")
        .range(start, start + 499);
      if (error) throw Error("Directory unavailable");
      target.push(...data);
      if (data.length < 500) break;
    }
  }
  const methods = await db
    .from("payment_methods")
    .select("name")
    .eq("active", true)
    .order("name");
  if (methods.error) throw Error("Methods unavailable");
  return { members, categories, methods: methods.data.map((m) => m.name) };
}
