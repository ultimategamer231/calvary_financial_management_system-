import { period, csv, report, duesReport, invalid } from "@/lib/reports";
import { decimal } from "@/lib/money";
import { requireStaff } from "@/lib/session";
export async function GET(request: Request) {
  await requireStaff();
  const f = period(Object.fromEntries(new URL(request.url).searchParams));
  if (invalid(f))
    return new Response("Invalid report filters", { status: 400 });
  const rows =
    f.view === "dues"
      ? [
          [
            "Member",
            "Category",
            "Due date",
            "Currency",
            "Assigned",
            "Paid",
            "Outstanding",
          ],
          ...(await duesReport(f)).map((r) => [
            r.member_name!,
            r.category_label!,
            r.due_date!,
            r.currency!,
            decimal(r.amount!),
            decimal(r.paid!),
            decimal(r.outstanding!),
          ]),
        ]
      : [
          [
            "Date",
            "Entry",
            "Kind",
            "Party",
            "Category",
            "Method",
            "Currency",
            "Amount",
          ],
          ...(await report(f)).rows.map((r) => [
            r.business_date,
            r.reference,
            r.kind,
            r.party,
            r.category,
            r.method,
            r.currency,
            decimal(r.amount),
          ]),
        ];
  return new Response(csv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calvary-report.csv"',
      "Cache-Control": "private, no-store",
    },
  });
}
