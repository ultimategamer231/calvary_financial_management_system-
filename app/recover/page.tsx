import Link from "next/link";
import { PasswordForm } from "./form";
export default function Page() {
  return (
    <main className="content">
      <Link href="/login">Staff sign in</Link>
      <h1>Recover account</h1>
      <PasswordForm />
    </main>
  );
}
