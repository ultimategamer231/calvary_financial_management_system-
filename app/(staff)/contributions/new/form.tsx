"use client";
import { useState, useTransition } from "react";
import type { choices, receipt } from "@/lib/collections";
import { money, decimal, minor } from "@/lib/money";
import { post } from "../actions";
type Props = {
  options: Awaited<ReturnType<typeof choices>>;
  original: Awaited<ReturnType<typeof receipt>> | null;
  dues: {
    id: string | null;
    member_id: string | null;
    category_id: string | null;
    currency: string | null;
    due_date: string | null;
    outstanding: number | null;
  }[];
  date: string;
};
export function CollectionForm({ options, original, date, dues }: Props) {
  const [key] = useState(() => crypto.randomUUID()),
    [kind, setKind] = useState(original?.payer_kind ?? "member"),
    [currency, setCurrency] = useState(original?.currency ?? "USD");
  const [member, setMember] = useState(original?.member_id ?? "");
  const [lines, setLines] = useState(
    original?.allocations.map((l) => ({
      category: l.category_id,
      obligation: l.obligation_id ?? "",
      amount: decimal(l.amount),
    })) ?? [{ category: "", amount: "", obligation: "" }],
  );
  const [draft, setDraft] = useState<Record<string, string> | null>(null),
    [error, setError] = useState(""),
    [pending, start] = useTransition();
  const total = lines.reduce((s, l) => s + (minor(l.amount) ?? 0n), 0n);
  function change(index: number, patch: Partial<(typeof lines)[number]>) {
    setLines(lines.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }
  return (
    <>
      <form
        className="panel record"
        hidden={!!draft}
        onSubmit={(e) => {
          e.preventDefault();
          const fields = Object.fromEntries(
            new FormData(e.currentTarget),
          ) as Record<string, string>;
          if (lines.some((l) => !minor(l.amount)) || total > 99999999999999n) {
            setError(
              "Enter a positive amount with up to two decimal places for every allocation.",
            );
            return;
          }
          setError("");
          setDraft(fields);
        }}
      >
        <label>
          Contributor type
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            {["member", "guest", "anonymous"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        {kind === "member" && (
          <label>
            Member
            <select
              name="member"
              required
              value={member}
              onChange={(e) => {
                setMember(e.target.value);
                setLines(lines.map((l) => ({ ...l, obligation: "" })));
              }}
            >
              <option value="">Choose member</option>
              {options.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {kind === "guest" && (
          <label>
            Guest name
            <input
              name="guest"
              required
              maxLength={160}
              defaultValue={
                original?.payer_kind === "guest" ? original.payer : ""
              }
            />
          </label>
        )}
        <label>
          Business date
          <input
            name="date"
            type="date"
            defaultValue={original?.business_date ?? date}
            required
          />
        </label>
        <label>
          Currency
          <select
            value={currency}
            onChange={(e) => {
              setCurrency(e.target.value);
              setLines(lines.map((l) => ({ ...l, obligation: "" })));
            }}
          >
            <option>USD</option>
            <option>LRD</option>
          </select>
        </label>
        <label>
          Payment method
          <select name="method" defaultValue={original?.method ?? "Cash"}>
            {options.methods.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Allocations</legend>
          {lines.map((l, i) => (
            <div className="allocation" key={i}>
              <label>
                Category {i + 1}
                <select
                  required
                  value={l.category}
                  onChange={(e) =>
                    change(i, { category: e.target.value, obligation: "" })
                  }
                >
                  <option value="">Choose category</option>
                  {options.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Amount {i + 1}
                <input
                  required
                  inputMode="decimal"
                  value={l.amount}
                  onChange={(e) => change(i, { amount: e.target.value })}
                />
              </label>
              {kind === "member" && (
                <label>
                  Apply allocation {i + 1} to
                  <select
                    value={l.obligation}
                    onChange={(e) => change(i, { obligation: e.target.value })}
                  >
                    <option value="">Voluntary contribution</option>
                    {dues
                      .filter(
                        (d) =>
                          d.member_id === member &&
                          d.category_id === l.category &&
                          d.currency === currency &&
                          (d.outstanding ||
                            original?.allocations.some(
                              (a) => a.obligation_id === d.id,
                            )),
                      )
                      .map((d) => (
                        <option key={d.id} value={d.id!}>
                          {d.due_date} · {money(currency, d.outstanding!)}{" "}
                          outstanding
                        </option>
                      ))}
                  </select>
                </label>
              )}
              {lines.length > 1 && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setLines(lines.filter((_, n) => n !== i))}
                >
                  Remove allocation {i + 1}
                </button>
              )}
            </div>
          ))}
          {lines.length < 50 && (
            <button
              className="secondary"
              type="button"
              onClick={() =>
                setLines([
                  ...lines,
                  { category: "", amount: "", obligation: "" },
                ])
              }
            >
              Add allocation
            </button>
          )}
        </fieldset>
        <label>
          Reference (optional)
          <input
            name="reference"
            maxLength={160}
            defaultValue={original?.reference}
          />
        </label>
        <label>
          Notes (optional)
          <input name="notes" maxLength={600} defaultValue={original?.notes} />
        </label>
        {original && (
          <label>
            Correction reason
            <input name="reason" required maxLength={300} />
          </label>
        )}
        <button>Review contribution</button>
      </form>
      {draft && (
        <section className="panel">
          <h2>Review contribution</h2>
          <p>
            {kind === "member"
              ? options.members.find((m) => m.id === draft.member)?.name
              : kind === "guest"
                ? draft.guest
                : "Anonymous"}{" "}
            · {draft.date} · {draft.method}
          </p>
          {lines.map((l, i) => (
            <p key={i}>
              {options.categories.find((c) => c.id === l.category)?.name} —{" "}
              {money(currency, minor(l.amount)!)}{" "}
              {kind === "member" && l.obligation
                ? " · Assigned commitment"
                : ""}
            </p>
          ))}
          <p>
            <strong>Total {money(currency, total)}</strong>
          </p>
          {draft.reference && <p>Reference: {draft.reference}</p>}
          {draft.notes && <p>Notes: {draft.notes}</p>}
          {original && (
            <p>
              Replaces {original.receipt} · {draft.reason}
            </p>
          )}
          <div className="commands">
            <button
              disabled={pending}
              aria-busy={pending}
              title="Post the reviewed contribution and issue its receipt"
              onClick={() =>
                start(async () => {
                  setError(
                    await post(key, {
                      ...draft,
                      kind,
                      currency,
                      total: String(total),
                      lines: lines.map((l) => ({
                        category: l.category,
                        obligation: kind === "member" ? l.obligation : "",
                        amount: String(minor(l.amount)),
                      })),
                      replaces: original?.id ?? "",
                    }),
                  );
                })
              }
            >
              {pending ? "Posting…" : "Post contribution"}
            </button>
            <button
              disabled={pending}
              className="secondary"
              onClick={() => setDraft(null)}
            >
              Back to edit
            </button>
          </div>
        </section>
      )}
      {error && (
        <p className="alert" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
