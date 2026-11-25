import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { money } from "@/lib/money";
import { invalid, period, report, type Filter, type Report } from "@/lib/reports";
import { Lines, movementTotals } from "../reports/report-ui";
import styles from "./dashboard.module.css";

const ledgers = [
  { currency: "USD", name: "US dollar" },
  { currency: "LRD", name: "Liberian dollar" },
];

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
});

function periodLabel({ from, to }: Filter) {
  if (from && to) return dateFormat.formatRange(new Date(from), new Date(to));
  if (from) return "From " + dateFormat.format(new Date(from));
  if (to) return "Through " + dateFormat.format(new Date(to));
  return "All recorded dates";
}

function Overview({ data }: { data: Report }) {
  return (
    <section aria-labelledby="movement-title">
      <h2 id="movement-title">Period movement</h2>
      <div className={styles.overview}>
        {ledgers.map(({ currency, name }) => {
          const { income, expense, net } = movementTotals(data, currency);
          return (
            <section className={styles.ledger} key={currency} aria-label={name}>
              <h3>{name}</h3>
              <dl>
                <div className={styles.net}><dt>Net recorded movement</dt><dd>{money(currency, net)}</dd></div>
                <div className={styles.detail}><dt>Recorded income</dt><dd>{money(currency, income)}</dd></div>
                <div className={styles.detail}><dt>Recorded expenses</dt><dd>{money(currency, expense)}</dd></div>
              </dl>
            </section>
          );
        })}
      </div>
    </section>
  );
}

function Categories({ data }: { data: Report }) {
  return (
    <section aria-labelledby="category-title">
      <h2 id="category-title">By category</h2>
      {data.groups.length ? (
        <div className={styles.categories}>
          {ledgers.map(({ currency, name }) => {
            const groups = data.groups.filter((group) => group.currency === currency);
            return (
              <div key={currency}>
                <h3>{name}</h3>
                {groups.length ? (
                  <div className={styles.categoryScroll} tabIndex={0} role="region" aria-label={name + " category breakdown"}>
                    <table aria-label={name + " categories"}>
                      <thead><tr><th scope="col">Category</th><th scope="col">Type</th><th scope="col">Amount</th></tr></thead>
                      <tbody>{groups.map((g) => (
                        <tr key={JSON.stringify([g.kind, g.category])}>
                          <td>{g.category}</td><td>{g.kind}</td><td>{money(currency, g.amount)}</td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                ) : <p className={styles.empty}>No matching categories.</p>}
              </div>
            );
          })}
        </div>
      ) : <p className={styles.empty}>No matching categories.</p>}
    </section>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<Filter> }) {
  await requireStaff();
  const f = period(await searchParams);
  const valid = !invalid(f);
  const data = valid ? await report(f) : null;
  const reportParams = new URLSearchParams(f);
  if (f.view === "dues") reportParams.delete("view");
  const activeFilters = [
    f.currency && ("Currency: " + f.currency),
    f.kind && ("Type: " + f.kind),
    f.method && ("Method: " + f.method),
    f.category && ("Category: " + f.category),
    f.member && "Selected member",
  ].filter(Boolean);
  return (
    <div className={styles.dashboard}>
      <div className={styles.heading}>
        <div>
          <h1>Dashboard</h1>
          {valid && <p>{periodLabel(f)}</p>}
        </div>
        <form className={styles.filters} aria-label="Reporting period">
          {Object.entries(f).filter(([key]) => !["from", "to"].includes(key)).map(([key, value]) => (
            <input type="hidden" key={key} name={key} value={value} />
          ))}
          <label>From<input type="date" name="from" defaultValue={f.from} /></label>
          <label>To<input type="date" name="to" defaultValue={f.to} /></label>
          <button>Update period</button>
        </form>
      </div>
      {data ? <>
        {activeFilters.length > 0 && <p className={styles.applied}>
          Filters applied · {activeFilters.join(" · ")}{" "}
          <Link href={"/dashboard?" + new URLSearchParams({ from: f.from, to: f.to })}>Clear filters</Link>
        </p>}
        <Overview data={data} />
        <section className={styles.entries} aria-labelledby="recent-title">
          <div className={styles.sectionHeading}>
            <h2 id="recent-title">Recent entries</h2>
            <Link href={"/reports?" + reportParams} prefetch={false}>View full report <span aria-hidden="true">→</span></Link>
          </div>
          {data.rows.length ? <Lines rows={data.rows.slice(0, 8)} recent /> :
            <p className={styles.empty}>No entries in this period. Adjust the dates to review another period.</p>}
        </section>
        <Categories data={data} />
      </> : <p role="alert" className={styles.alert}>Choose a valid date range and check any member filter. <Link href="/dashboard">Reset dashboard</Link></p>}
    </div>
  );
}
