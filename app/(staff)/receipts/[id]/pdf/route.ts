import PDFDocument from "pdfkit";
import path from "node:path";
import { requireStaff } from "@/lib/session";
import { receipt } from "@/lib/collections";
import { money } from "@/lib/money";
export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireStaff();
  const r = await receipt((await params).id);
  const doc = new PDFDocument({ size: "A4", margin: 48 });
  doc
    .image(path.join(process.cwd(), "public/church-seal.jpeg"), { width: 72 })
    .moveDown()
    .fillColor("#08085d");
  const chunks: Buffer[] = [];
  const complete = new Promise<Buffer>((ok, fail) => {
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => ok(Buffer.concat(chunks)));
    doc.on("error", fail);
  });
  doc
    .font(
      path.join(
        process.cwd(),
        "node_modules/@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff",
      ),
    )
    .fontSize(20)
    .text(r.church_name)
    .fontSize(12)
    .text([r.church_address, r.church_phone].filter(Boolean).join(" · "))
    .moveDown()
    .text("Receipt " + r.receipt)
    .fontSize(12);
  if (r.collection_voids) doc.text("VOID — " + r.collection_voids.reason);
  doc
    .moveDown()
    .text("Received from: " + r.payer)
    .text(r.business_date + " · " + r.method)
    .text("Received by: " + r.officer);
  if (r.reference) doc.text("Reference: " + r.reference);
  doc.moveDown();
  for (const l of r.allocations)
    doc.text(l.category_label + "    " + money(r.currency, l.amount));
  doc.moveDown().text("Total: " + money(r.currency, r.total));
  if (r.replacement) doc.text("Replacement receipt: " + r.replacement.receipt);
  if (r.replaces) {
    const original = await receipt(r.replaces);
    doc.text("Corrects receipt: " + original.receipt);
  }
  doc.end();
  return new Response(new Uint8Array(await complete), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="' + r.receipt + '.pdf"',
      "Cache-Control": "private, no-store",
    },
  });
}
