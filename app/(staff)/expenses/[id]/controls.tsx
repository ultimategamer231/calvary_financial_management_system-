"use client";
import { useActionState } from "react";
import { uploadEvidence, voidExpense } from "../actions";
export function Controls({ id, active }: { id: string; active: boolean }) {
  const [message, upload, busy] = useActionState(
    uploadEvidence.bind(null, id),
    "",
  );
  const [error, cancel, pending] = useActionState(
    voidExpense.bind(null, id),
    "",
  );
  return (
    <>
      {active && (
        <details>
          <summary>Void expense</summary>
          <form action={cancel}>
            <label>
              Reason
              <input required name="reason" maxLength={300} />
            </label>
            <button disabled={pending}>Confirm void</button>
            <p role="status">{error}</p>
          </form>
        </details>
      )}
      <form action={upload}>
        <label>
          Supporting document (PDF, JPEG or PNG, up to 2 MB)
          <input
            name="file"
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            required
          />
        </label>
        <button disabled={busy}>Attach evidence</button>
        <p role="status">{message}</p>
      </form>
    </>
  );
}
