"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useFormStatus } from "react-dom";

type ButtonProps = {
  label: string;
  busyLabel: string;
  hint: string;
  secondary?: boolean;
  disabled?: boolean;
  busy?: boolean;
};

export function SubmitButton({ label, busyLabel, hint, secondary, disabled, busy }: ButtonProps) {
  const { pending } = useFormStatus();
  const working = pending || busy;
  const id = useId();
  const [showHint, setShowHint] = useState(false);
  useEffect(() => {
    if (!showHint) return;
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowHint(false);
    };
    window.addEventListener("keydown", dismiss);
    return () => window.removeEventListener("keydown", dismiss);
  }, [showHint]);

  return (
    <span className="submit-control"
      onPointerEnter={(event) => setShowHint(event.pointerType === "mouse")}
      onPointerLeave={() => setShowHint(false)}>
      <button type="submit" className={secondary ? "secondary" : undefined}
        aria-describedby={id} aria-busy={!!working} disabled={disabled || working}
        onFocus={(event) => setShowHint(event.currentTarget.matches(":focus-visible"))}
        onBlur={() => setShowHint(false)}>
        {working ? busyLabel : label}
      </button>
      <span id={id} role="tooltip" className="action-hint" hidden={!showHint || working}>{hint}</span>
    </span>
  );
}

export function FilterForm({ children, action, className, name, label, busyLabel, hint }: {
  children: React.ReactNode;
  action?: string;
  className: string;
  name?: string;
  label: string;
  busyLabel: string;
  hint: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [busy, startTransition] = useTransition();
  return (
    <form key={search.toString()} action={action} method="get" className={className} aria-label={name}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const url = new URL(form.action);
        url.search = "";
        for (const [key, value] of new FormData(form)) {
          if (typeof value === "string") url.searchParams.append(key, value);
        }
        startTransition(() => {
          if (url.href === window.location.href) router.refresh();
          else router.push(url.pathname + url.search, { scroll: false });
        });
      }}>
      {children}
      <SubmitButton label={label} busyLabel={busyLabel} hint={hint} busy={busy} />
    </form>
  );
}
