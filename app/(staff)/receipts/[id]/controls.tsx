"use client";
import { useActionState } from "react";
import { voidReceipt } from "../../contributions/actions";
export function Print() {
  return (
    <button className="secondary" onClick={() => window.print()}>
      Print
    </button>
  );
}
export function Void({ id }: { id: string }) {
  const [message, action, pending] = useActionState(
    voidReceipt.bind(null, id),
    "",
  );
  return (
    <details>
      <summary>Void receipt</summary>
      <form action={action}>
        <label>
          Reason for voiding
          <input name="reason" required maxLength={300} />
        </label>
        <button disabled={pending}>Confirm void</button>
        {message && <p role="alert">{message}</p>}
      </form>
    </details>
  );
}
