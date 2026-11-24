"use client";
import { useState, useActionState } from "react";
import { assign } from "./actions";
export function Assign({
  members,
  categories,
}: {
  members: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}) {
  const [key, setKey] = useState(() => crypto.randomUUID());
  const [message, action, pending] = useActionState(
    async (prev: string, data: FormData) => {
      const result = await assign(key, data);
      if (result === "Assignment saved.") setKey(crypto.randomUUID());
      return result;
    },
    "",
  );
  return (
    <details className="panel">
      <summary>Assign dues or commitment</summary>
      <form action={action}>
        <label>
          Members (select one or more)
          <select
            name="members"
            multiple
            size={Math.min(8, Math.max(2, members.length))}
            required
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Group label (optional)
          <input name="group" maxLength={100} />
        </label>
        <label>
          Category
          <select name="category" required>
            <option value="">Choose category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due date
          <input name="date" required type="date" />
        </label>
        <label>
          Currency
          <select name="currency">
            <option>USD</option>
            <option>LRD</option>
          </select>
        </label>
        <label>
          Amount per member
          <input required name="amount" inputMode="decimal" />
        </label>
        <button disabled={pending}>Assign to selected members</button>
        {message && <p role="status">{message}</p>}
      </form>
    </details>
  );
}
