import Link from "next/link";
import { requireStaff } from "@/lib/session";
export default async function Dashboard() {
  const staff = await requireStaff();
  return (
    <>
      <h1>Dashboard</h1>
      <section className="panel">
        <h2>Staff workspace</h2>
        <p>Signed in as {staff.label}.</p>
        <Link href="/account">View account details →</Link>
      </section>
    </>
  );
}
