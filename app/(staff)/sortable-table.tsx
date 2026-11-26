"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Cell = string | { text: string; href?: string; detail?: string; currency?: string; minor?: string };
type TableRow = { id: string; cells: Cell[] };
type Order = { column: string; descending: boolean };

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

function compareCells(a: Cell, b: Cell, descending: boolean) {
  const sign = descending ? -1 : 1;
  if (typeof a !== "string" && typeof b !== "string" && a.minor != null && b.minor != null) {
    const currency = collator.compare(a.currency ?? "", b.currency ?? "");
    if (currency) return currency;
    const x = BigInt(a.minor);
    const y = BigInt(b.minor);
    return sign * (x < y ? -1 : x > y ? 1 : 0);
  }
  return sign * collator.compare(typeof a === "string" ? a : a.text, typeof b === "string" ? b : b.text);
}

function display(cell: Cell, column: string) {
  if (typeof cell === "string") {
    return column === "Date" || column === "Due date" ? <time dateTime={cell}>{cell}</time> : cell;
  }
  return <>
    {cell.href ? <Link href={cell.href}>{cell.text}</Link> : cell.text}
    {cell.detail && <small>{cell.detail}</small>}
  </>;
}

export function SortableTable({ label, columns, rows, initialOrder }: {
  label: string;
  columns: string[];
  rows: TableRow[];
  initialOrder?: Order;
}) {
  const [order, setOrder] = useState<Order | null>(null);
  const active = order ?? initialOrder;
  const sorted = useMemo(() => {
    if (!order) return rows;
    const index = columns.indexOf(order.column);
    if (index < 0) return rows;
    return [...rows].sort((a, b) => compareCells(a.cells[index], b.cells[index], order.descending));
  }, [rows, columns, order]);

  return (
    <table className="ledger-table" aria-label={label}>
      <thead><tr>
        {columns.map((column, i) => {
          const current = active?.column === column ? active : null;
          const first = rows[0]?.cells[i];
          const money = typeof first === "object" && first.minor != null;
          const descending = current ? !current.descending : money;
          const hint = "Sort " + column.toLowerCase() + (descending ? " descending" : " ascending") + (money ? " within each currency" : "");
          return (
            <th key={column} scope="col" className={money ? "amount-cell" : undefined}
              aria-sort={current ? (current.descending ? "descending" : "ascending") : undefined}>
              {rows.length > 1 ? (
                <button className="sort-trigger" type="button" title={hint}
                  onClick={() => setOrder({ column, descending })}>
                  {column}<span aria-hidden="true">{current ? (current.descending ? "↓" : "↑") : "↕"}</span>
                </button>
              ) : column}
            </th>
          );
        })}
      </tr></thead>
      <tbody>{sorted.map(({ id, cells }) => (
        <tr key={id}>{cells.map((cell, i) => (
          <td key={columns[i]} className={typeof cell === "object" && cell.minor != null ? "amount-cell" : undefined}>
            {display(cell, columns[i])}
          </td>
        ))}</tr>
      ))}</tbody>
    </table>
  );
}
