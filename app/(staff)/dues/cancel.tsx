"use client";
import { useActionState } from "react";
import { cancel } from "./actions";
export function Cancel({ id }: { id: string }) {
  const [message, action, pending] = useActionState(cancel.bind(null, id), "");
  return (
    <details>
      <summary>Cancel</summary>
      <form action={action}>
        <label>
          Cancellation reason
          <input name="reason" required maxLength={300} />
        </label>
        <button disabled={pending}>Confirm cancellation</button>
        <p role="status">{message}</p>
      </form>
    </details>
  );
}
