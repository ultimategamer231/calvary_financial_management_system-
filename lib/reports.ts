import { database } from "./session";
import { today } from "./money";
export type Filter = Record<string, string>;
export type Movement = {
  record_id: string;
  reference: string;
  business_date: string;
  party: string;
  currency: string;
  category: string;
  kind: string;
  method: string;
  amount: string;
};
export type Report = {
  totals: { currency: string; income: string; expense: string }[];
  groups: {
    currency: string;
    kind: string;
    category: string;
    amount: string;
  }[];
  rows: Movement[];
};
export function period(raw: Filter, all = false) {
  const now = today();
  const last = new Date(
    Date.UTC(Number(now.slice(0, 4)), Number(now.slice(5, 7)), 0),
  )
    .toISOString()
    .slice(0, 10);
  const result: Filter = {
    from: all ? "" : now.slice(0, 7) + "-01",
    to: all ? "" : last,
  };
  for (const key of [
    "from",
    "to",
    "kind",
    "member",
    "currency",
    "category",
    "method",
    "view",
  ])
    if (typeof raw[key] === "string") result[key] = raw[key];
  if (result.view === "income" || result.view === "statement")
    result.kind = "Income";
  else if (result.view === "expense") result.kind = "Expense";
  else delete result.kind;
  return result;
}
export function invalid(f: Filter) {
  const valid = (d: string) =>
    !d ||
    (/^\d{4}-\d\d-\d\d$/.test(d) &&
      Number.isFinite(Date.parse(d)) &&
      new Date(d).toISOString().slice(0, 10) === d);
  return (
    !valid(f.from) ||
    !valid(f.to) ||
    Boolean(f.from && f.to && f.from > f.to) ||
    Boolean(
      f.member && !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(f.member),
    )
  );
}
export async function report(filters: Filter): Promise<Report> {
  const db = await database();
  const { data, error } = await db.rpc("finance_report", { filters });
  if (error) throw Error("Unable to reconcile report");
  return data as unknown as Report;
}
export async function duesReport(f: Filter) {
  const db = await database();
  const rows = [];
  for (let start = 0; ; start += 500) {
    const q = db
      .from("dues_balances")
      .select("*")
      .order("due_date")
      .order("id");
    if (f.from) q.gte("due_date", f.from);
    if (f.to) q.lte("due_date", f.to);
    if (f.currency) q.eq("currency", f.currency);
    if (f.member) q.eq("member_id", f.member);
    if (f.category) q.eq("category_label", f.category);
    const { data, error } = await q.range(start, start + 499);
    if (error) throw Error("Unable to load dues report");
    rows.push(...data);
    if (data.length < 500) return rows;
  }
}
export function csv(rows: string[][]) {
  return (
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map(
            (cell) =>
              '"' +
              (/^[\s]*[=+@-]/.test(cell) ? "'" : "") +
              cell.replaceAll('"', '""') +
              '"',
          )
          .join(","),
      )
      .join("\r\n") +
    "\r\n"
  );
}
