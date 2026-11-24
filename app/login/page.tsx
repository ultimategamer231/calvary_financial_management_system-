import { Seal } from "@/app/seal";
import Link from "next/link";
import { signIn } from "../actions";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="signin">
      <section className="identity">
        <Seal size={160} />
        <div>
          <p className="wordmark">Calvary Baptist Church</p>
          <p>Financial Management System</p>
        </div>
      </section>
      <section className="formpane">
        <form action={signIn}>
          <h1>Staff sign in</h1>
          <p className="muted">Access the church finance workspace.</p>
          {error && (
            <p className="alert" role="alert">
              {error === "access"
                ? "Your account has no active staff assignment."
                : "Check your email and password and try again."}
            </p>
          )}
          <label>
            Email address
            <input
              type="email"
              autoComplete="username"
              name="email"
              required
              maxLength={254}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              name="password"
              required
              maxLength={1024}
            />
          </label>
          <button>Sign in</button>
          <p>
            <Link href="/recover">Forgot password?</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
