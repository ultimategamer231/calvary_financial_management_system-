import { evidenceFormat, evidenceName } from "@/lib/evidence";
import { database, requireStaff } from "@/lib/session";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireStaff();
  const { id } = await params;
  const file = new URL(req.url).searchParams.get("file") ?? "";
  if (!/^[a-z0-9._~-]+$/i.test(file) || file === "." || file === ".." ||
      !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(id))
    return new Response(null, { status: 404 });
  const db = await database();
  const r = await db.storage.from("expense-evidence").download(id + "/" + file);
  if (r.error) return new Response(null, { status: 404 });
  const format = evidenceFormat(new Uint8Array(await r.data.slice(0, 8).arrayBuffer()));
  if (!format) return new Response(null, { status: 415 });
  const name = evidenceName(file.replace(/^[\da-f-]{36}[_~][\da-f-]{36}[_~]/i, ""), format.suffix);
  return new Response(r.data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": 'attachment; filename="' + name + '"',
      "Cache-Control": "private, no-store",
    },
  });
}
