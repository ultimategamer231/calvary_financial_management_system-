import Link from "next/link";

type Query = Record<string, string | undefined>;
type Column = { label: string; field?: string; money?: boolean };
type Order = { field: string; descending: boolean };

export function registerOrder(columns: Column[], query: Query, field: string, descending = false): Order {
  const selected = columns.find((column) => column.field && column.field === query.sort);
  return selected?.field ? { field: selected.field, descending: query.dir === "desc" } : { field, descending };
}

export function SortFields({ order }: { order: Order }) {
  return <>
    <input type="hidden" name="sort" value={order.field} />
    <input type="hidden" name="dir" value={order.descending ? "desc" : "asc"} />
  </>;
}

export function RegisterHead({ columns, query, order, path }: {
  columns: Column[]; query: Query; order: Order; path: string;
}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (typeof value === "string" && !["sort", "dir", "page", "saved"].includes(key)) params.set(key, value);
  }
  return (
    <thead><tr>{columns.map(({ label, field, money }) => {
      if (!field) return <th key={label} scope="col">{label}</th>;
      const active = order.field === field;
      const desc = active ? !order.descending : !!money;
      const next = new URLSearchParams(params);
      next.set("sort", field);
      next.set("dir", desc ? "desc" : "asc");
      const hint = "Sort " + label.toLowerCase() + (desc ? " descending" : " ascending") + (money ? " within each currency" : "");
      return (
        <th key={field} scope="col" className={money ? "amount-cell" : undefined}
          aria-sort={active ? (order.descending ? "descending" : "ascending") : undefined}>
          <Link className="sort-trigger" href={path + "?" + next} scroll={false} prefetch={false} title={hint}>
            {label}<span aria-hidden="true">{active ? (order.descending ? "↓" : "↑") : "↕"}</span>
          </Link>
        </th>
      );
    })}</tr></thead>
  );
}
