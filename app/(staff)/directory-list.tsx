import Link from "next/link";
import { redirect } from "next/navigation";
import { database } from "@/lib/session";
import type { DirectoryKind, DirectoryRecord } from "@/lib/directory";

export type Filters = {
  q?: string;
  status?: string;
  page?: string;
  saved?: string;
};
export async function DirectoryList({
  kind,
  filters,
}: {
  kind: DirectoryKind;
  filters: Filters;
}) {
  const member = kind === "members";
  const term =
    typeof filters.q === "string" ? filters.q.trim().slice(0, 120) : "";
  const status = ["active", "inactive"].includes(filters.status ?? "")
    ? filters.status
    : "all";
  const page = Math.max(
    1,
    Math.min(1000000, parseInt(filters.page ?? "1", 10) || 1),
  );
  const size = 25;
  const db = await database();
  const search = member
    ? db.rpc("find_members", { term }, { count: "exact" }).select("*")
    : db.from("categories").select("*", { count: "exact" });
  if (status !== "all") search.eq("active", status === "active");
  const { data, error, count } = await search
    .order("name")
    .order("id")
    .range((page - 1) * size, page * size - 1);
  if (page > 1 && (error?.code === "PGRST103" || (!error && !data?.length)))
    redirect(
      "/" +
        kind +
        "?" +
        new URLSearchParams({ q: term, status: status ?? "all" }),
    );
  if (error) throw new Error("The directory could not be loaded.");
  const rows: DirectoryRecord[] = data ?? [];
  const title = member ? "Members" : "Payment categories";
  const noun = member ? "member" : "category";
  const root = "/" + kind;
  const pageHref = (n: number) =>
    root +
    "?" +
    new URLSearchParams({ q: term, status: status ?? "all", page: String(n) });
  return (
    <>
      <div className="title-row">
        <h1>{title}</h1>
        <Link className="action" href={root + "/new"}>
          Add {noun}
        </Link>
      </div>
      {!member && filters.saved === "1" && (
        <p role="status" className="notice">
          Category saved.
        </p>
      )}
      <section className="directory">
        <form className="filters" action={root}>
          {member && (
            <label>
              Search members
              <input
                name="q"
                placeholder="Name, phone or member ID"
                maxLength={120}
                defaultValue={term}
              />
            </label>
          )}
          <label>
            Status
            <select name="status" defaultValue={status}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">
                {member ? "Archived" : "Inactive"}
              </option>
            </select>
          </label>
          <button>Apply filters</button>
        </form>
        {rows.length ? (
          <div
            className="table-scroll"
            role="region"
            aria-label={title}
            tabIndex={0}
          >
            <table>
              <caption className="sr-only">{title}</caption>
              <thead>
                <tr>
                  <th>{member ? "Member ID" : "Category"}</th>
                  <th>{member ? "Name" : "Group"}</th>
                  {member && <th>Phone</th>}
                  <th>Status</th>
                  {!member && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{member ? r.member_number : r.name}</td>
                    <td>
                      {member ? (
                        <Link href={root + "/" + r.id}>{r.name}</Link>
                      ) : (
                        r.group_name || "Ungrouped"
                      )}
                    </td>
                    {member && <td>{r.phone || "—"}</td>}
                    <td>
                      <span className={r.active ? "pill" : "pill off"}>
                        {r.active ? "Active" : member ? "Archived" : "Inactive"}
                      </span>
                    </td>
                    {!member && (
                      <td>
                        <Link
                          href={root + "/" + r.id + "/edit"}
                          aria-label={"Edit " + r.name}
                        >
                          Edit
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty">No {member ? "members" : "categories"} found.</p>
        )}
        <div className="pages">
          <span>
            {count ?? 0} {member ? "members" : "categories"}
          </span>
          {page > 1 && <Link href={pageHref(page - 1)}>Previous</Link>}
          {page * size < (count ?? 0) && (
            <Link href={pageHref(page + 1)}>Next</Link>
          )}
        </div>
      </section>
    </>
  );
}
