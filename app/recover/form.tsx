"use client";
import { useActionState } from "react";
import { changePassword, requestReset } from "../auth/recovery/actions";
export function PasswordForm({ change = false }: { change?: boolean }) {
  const [msg, action, busy] = useActionState(
    change ? changePassword : requestReset,
    "",
  );
  return (
    <form action={action} className="panel">
      {change ? (
        <>
          <label>
            New password
            <input
              type="password"
              name="password"
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              required
            />
          </label>
          <label>
            Confirm password
            <input
              type="password"
              name="confirm"
              autoComplete="new-password"
              required
            />
          </label>
        </>
      ) : (
        <label>
          Email address
          <input type="email" name="email" required />
        </label>
      )}
      <button disabled={busy}>
        {change ? "Update password" : "Request recovery email"}
      </button>
      <p role="status">{msg}</p>
    </form>
  );
}
