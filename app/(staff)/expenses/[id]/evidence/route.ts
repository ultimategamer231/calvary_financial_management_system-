import { database, requireStaff } from "@/lib/session";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireStaff();
  const { id } = await params;
  const file = new URL(req.url).searchParams.get("file") ?? "";
  if (!/^[a-z0-9._~-]+$/i.test(file) || !/^[\da-f-]{36}$/i.test(id))
    return new Response(null, { status: 404 });
  const db = await database();
  const r = await db.storage.from("expense-evidence").download(id + "/" + file);
  if (r.error) return new Response(null, { status: 404 });
  return new Response(r.data, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition":
        'attachment; filename="' + file.split("~").at(-1) + '"',
      "Cache-Control": "private, no-store",
    },
  });
}
