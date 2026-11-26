import { RegisterHead, registerOrder, SortFields } from "./register-order";
import { FilterForm } from "@/app/submit-button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { database } from "@/lib/session";
import type { DirectoryKind, DirectoryRecord } from "@/lib/directory";

export type Filters = {
  sort?: string;
  dir?: string;
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
  const columns = member
    ? [{ label: "Member ID" }, { label: "Name", field: "name" }, { label: "Phone" }, { label: "Status", field: "active" }]
    : [{ label: "Category", field: "name" }, { label: "Group", field: "group_name" }, { label: "Status", field: "active" }, { label: "Action" }];
  const order = registerOrder(columns, filters, "name");
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
    .order(order.field, { ascending: !order.descending })
    .order("id")
    .range((page - 1) * size, page * size - 1);
  if (page > 1 && (error?.code === "PGRST103" || (!error && !data?.length)))
    redirect(
      "/" +
        kind +
        "?" +
        new URLSearchParams({ q: term, status: status ?? "all", sort: order.field, dir: order.descending ? "desc" : "asc" }),
    );
  if (error) throw new Error("The directory could not be loaded.");
  const rows: DirectoryRecord[] = data ?? [];
  const title = member ? "Members" : "Payment categories";
  const noun = member ? "member" : "category";
  const root = "/" + kind;
  const pageHref = (n: number) =>
    root +
    "?" +
    new URLSearchParams({ q: term, status: status ?? "all", sort: order.field, dir: order.descending ? "desc" : "asc", page: String(n) });
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
        <FilterForm className="filters" action={root} label="Apply filters" busyLabel="Filtering…" hint="Apply these filters to the directory.">
          <SortFields order={order} />
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
        </FilterForm>
        {rows.length ? (
          <div
            className="table-scroll"
            role="region"
            aria-label={title}
            tabIndex={0}
          >
            <table>
              <caption className="sr-only">{title}</caption>
              <RegisterHead columns={columns} query={filters} order={order} path={root} />
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
