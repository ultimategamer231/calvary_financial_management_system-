"use client";
import { useActionState } from "react";
import { saveSetting } from "./actions";
export function SettingsForms({
  profile,
  methods,
}: {
  profile: { name: string; address: string; phone: string };
  methods: { name: string; active: boolean }[];
}) {
  const [message, submit, pending] = useActionState(saveSetting, "");
  return (
    <>
      <section className="panel">
        <h2>Church profile</h2>
        <form action={submit}>
          <input type="hidden" name="operation" value="profile" />
          {(["name", "address", "phone"] as const).map((k) => (
            <label key={k}>
              {k === "name"
                ? "Church name"
                : k === "address"
                  ? "Address"
                  : "Phone"}
              <input
                name={k}
                defaultValue={profile[k]}
                required={k === "name"}
                maxLength={k === "name" ? 150 : k === "phone" ? 60 : 300}
              />
            </label>
          ))}
          <button disabled={pending}>Save church profile</button>
        </form>
      </section>
      <section className="panel">
        <h2>Payment methods</h2>
        {methods.map((m) => (
          <form className="method-row" action={submit} key={m.name}>
            <input type="hidden" name="operation" value="method" />
            <input type="hidden" name="method" value={m.name} />
            <input type="hidden" name="active" value={String(!m.active)} />
            <span>
              {m.name} · {m.active ? "Active" : "Inactive"}
            </span>
            <button className="secondary" disabled={pending}>
              {m.active ? "Deactivate" : "Reactivate"} {m.name}
            </button>
          </form>
        ))}
        <form action={submit}>
          <input type="hidden" name="operation" value="add" />
          <label>
            New method
            <input name="method" required maxLength={80} />
          </label>
          <button disabled={pending}>Add method</button>
        </form>
      </section>
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
    </>
  );
}
