"use client";

import { SubmitButton } from "@/app/submit-button";
import { useState, useActionState } from "react";
import { saveExpense } from "./actions";
import type { Database } from "@/lib/database.types";
import { decimal } from "@/lib/money";
type Row = Database["public"]["Tables"]["expenses"]["Row"];
export function ExpenseForm({
  methods,
  projects,
  original,
  date,
}: {
  methods: string[];
  projects: { id: string; name: string }[];
  original: Row | null;
  date: string;
}) {
  const [key] = useState(() => crypto.randomUUID());
  const [error, action, pending] = useActionState(
    saveExpense.bind(null, key, original?.id ?? ""),
    "",
  );
  return (
    <form className="panel record" action={action}>
      <label>
        Payee
        <input
          required
          name="payee"
          maxLength={160}
          defaultValue={original?.payee}
        />
      </label>
      <label>
        Description
        <input
          required
          name="description"
          maxLength={600}
          defaultValue={original?.description}
        />
      </label>
      <label>
        Expense category
        <input
          required
          name="category"
          list="expense-types"
          maxLength={120}
          defaultValue={original?.category}
        />
      </label>
      <datalist id="expense-types">
        {["Supplies", "Utilities", "Program", "Ministry", "Other"].map((s) => (
          <option key={s}>{s}</option>
        ))}
      </datalist>
      <label>
        Related project (optional)
        <select name="project" defaultValue={original?.project_id ?? ""}>
          <option value="">None</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Business date
        <input
          required
          type="date"
          name="date"
          defaultValue={original?.business_date ?? date}
        />
      </label>
      <label>
        Currency
        <select name="currency" defaultValue={original?.currency ?? "USD"}>
          <option>USD</option>
          <option>LRD</option>
        </select>
      </label>
      <label>
        Amount
        <input
          required
          name="amount"
          inputMode="decimal"
          defaultValue={original ? decimal(original.amount) : ""}
        />
      </label>
      <label>
        Payment method
        <select name="method" defaultValue={original?.method ?? "Cash"}>
          {methods.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </label>
      {original && (
        <label>
          Correction reason
          <input name="reason" required maxLength={300} />
        </label>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
      <SubmitButton label={original ? "Post correction" : "Post expense"} busyLabel="Posting…" hint="Save this expense to its currency ledger." busy={pending} />
    </form>
  );
}
