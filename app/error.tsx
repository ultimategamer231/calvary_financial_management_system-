"use client";
export default function ApplicationError({ reset }: { reset: () => void }) {
  return (
    <main className="content">
      <h1>Workspace unavailable</h1>
      <p className="muted">We couldn’t load this page. Please try again.</p>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
