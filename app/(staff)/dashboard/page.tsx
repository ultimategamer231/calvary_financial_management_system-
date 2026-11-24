import { requireStaff } from "@/lib/session";
import { Totals, Lines, Groups } from "../reports/report-ui";
import { period, invalid, report, type Filter } from "@/lib/reports";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Filter>;
}) {
  const staff = await requireStaff(),
    f = period(await searchParams);
  const data = invalid(f) ? null : await report(f);
  return (
    <>
      <h1>Dashboard</h1>
      <p>Signed in as {staff.label}.</p>
      <form className="filters">
        <label>
          From
          <input type="date" name="from" defaultValue={f.from} />
        </label>
        <label>
          To
          <input type="date" name="to" defaultValue={f.to} />
        </label>
        <button>Update period</button>
      </form>
      {data ? (
        <>
          <Totals data={data} />
          <Groups data={data} />
          <section className="directory">
            <h2>Recent entries</h2>
            <Lines rows={data.rows.slice(0, 8)} />
          </section>
        </>
      ) : (
        <p role="alert">Choose a valid date range.</p>
      )}
    </>
  );
}
