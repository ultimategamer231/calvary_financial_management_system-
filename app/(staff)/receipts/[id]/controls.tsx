"use client";

import { SubmitButton } from "@/app/submit-button";
import { useActionState } from "react";
import { voidReceipt } from "../../contributions/actions";
export function Print() {
  return (
    <button className="secondary" title="Open the print dialog" onClick={() => window.print()}>
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
        <SubmitButton label="Confirm void" busyLabel="Voiding…" hint="Void this receipt with the reason entered." busy={pending} />
        {message && <p role="alert">{message}</p>}
      </form>
    </details>
  );
}
