import Link from "next/link";
import { choices } from "@/lib/collections";
import { money } from "@/lib/money";
import {
  duesReport,
  invalid,
  period,
  report,
  type Filter,
  type Report,
} from "@/lib/reports";
import { Print } from "../receipts/[id]/controls";
export function Totals({ data }: { data: Report }) {
  return (
    <div className="summary-grid">
      {["USD", "LRD"].map((currency) => {
        const r = data.totals.find((t) => t.currency === currency);
        const income = BigInt(r?.income ?? 0),
          expense = BigInt(r?.expense ?? 0);
        return (
          <section className="panel" key={currency}>
            <h2>{currency}</h2>
            <dl>
              {[
                ["Recorded income", income],
                ["Recorded expenses", expense],
                ["Net recorded movement", income - expense],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt>{String(label)}</dt>
                  <dd>{money(currency, value)}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
export function Lines({ rows }: { rows: Report["rows"] }) {
  return (
    <div
      className="table-scroll"
      role="region"
      aria-label="Report table"
      tabIndex={0}
    >
      <table>
        <thead>
          <tr>
            {[
              "Date",
              "Entry",
              "Payer / payee",
              "Category",
              "Method",
              "Amount",
            ].map((s) => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.business_date}</td>
              <td>
                <Link
                  href={
                    (r.kind === "Income" ? "/receipts/" : "/expenses/") +
                    r.record_id
                  }
                >
                  {r.reference}
                </Link>
              </td>
              <td>{r.party}</td>
              <td>{r.category}</td>
              <td>{r.method}</td>
              <td>{money(r.currency, r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="empty">No matching entries.</p>}
    </div>
  );
}
export function Groups({ data }: { data: Report }) {
  return (
    <section className="panel">
      <h2>By category</h2>
      {!data.groups.length && <p>No matching categories.</p>}
      {data.groups.map((g) => (
        <p key={JSON.stringify(g)}>
          {g.category} · {g.kind} · {money(g.currency, g.amount)}
        </p>
      ))}
    </section>
  );
}
export async function ReportPage({
  raw,
  member,
  name,
}: {
  raw: Filter;
  member?: string;
  name?: string;
}) {
  const f = period(raw, !!member);
  if (member) {
    f.member = member;
    f.kind = "Income";
    f.view = "statement";
  }
  const opts = await choices(),
    due = f.view === "dues";
  if (due) {
    delete f.method;
    delete f.kind;
  }
  const valid = !invalid(f);
  const data = valid && !due ? await report(f) : null,
    dues = valid && due ? await duesReport(f) : [];
  return (
    <>
      <h1>{member ? "Member statement" : "Financial reports"}</h1>
      {name && <h2>{name}</h2>}
      <form className="filters no-print">
        {!member && (
          <label>
            Report
            <select name="view" defaultValue={f.view}>
              <option value="movement">Period movement</option>
              <option value="income">Income by category</option>
              <option value="expense">Expenses</option>
              <option value="statement">Member contributions</option>
              <option value="dues">Dues balances</option>
            </select>
          </label>
        )}
        <label>
          From
          <input type="date" name="from" defaultValue={f.from} />
        </label>
        <label>
          To
          <input type="date" name="to" defaultValue={f.to} />
        </label>
        <label>
          Currency
          <select name="currency" defaultValue={f.currency}>
            <option value="">Both currencies</option>
            <option>USD</option>
            <option>LRD</option>
          </select>
        </label>
        {!member && (
          <label>
            Member
            <select name="member" defaultValue={f.member}>
              <option value="">All</option>
              {opts.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Category
          <input name="category" defaultValue={f.category} />
        </label>
        {!due && (
          <label>
            Payment method
            <input name="method" list="methods" defaultValue={f.method} />
          </label>
        )}
        <datalist id="methods">
          {opts.methods.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </datalist>
        <button>Generate report</button>
      </form>
      {valid ? (
        <>
          <p>
            {f.from || "Beginning of records"} through {f.to || "latest record"}
          </p>
          <div className="commands">
            <Print />
            <a href={"/reports/export?" + new URLSearchParams(f)}>Export CSV</a>
          </div>
          {data && (
            <>
              <Totals data={data} />
              <Groups data={data} />
              <Lines rows={data.rows} />
            </>
          )}
          {due && (
            <>
              <h2>Current balances by due date</h2>
              <div
                className="table-scroll"
                role="region"
                aria-label="Report table"
                tabIndex={0}
              >
                <table>
                  <thead>
                    <tr>
                      {[
                        "Member",
                        "Due date",
                        "Category",
                        "Assigned",
                        "Paid",
                        "Outstanding",
                      ].map((s) => (
                        <th key={s}>{s}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dues.map((d) => (
                      <tr key={d.id}>
                        <td>{d.member_name}</td>
                        <td>{d.due_date}</td>
                        <td>{d.category_label}</td>
                        {[d.amount, d.paid, d.outstanding].map((v, i) => (
                          <td key={i}>{money(d.currency!, v!)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {!dues.length && <p>No matching commitments.</p>}
            </>
          )}
        </>
      ) : (
        <p role="alert">Choose a valid date range and member.</p>
      )}
    </>
  );
}
