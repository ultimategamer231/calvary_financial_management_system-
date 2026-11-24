import Link from "next/link";
import { requireStaff } from "@/lib/session";
import { signOut } from "../actions";
export const dynamic = "force-dynamic";
export default async function Workspace({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  return (
    <div className="workspace">
      <aside>
        <div className="brand">
          Calvary Baptist Church<small>Financial Management System</small>
        </div>
        <nav aria-label="Workspace">
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/contributions">Contributions</Link>
          <Link href="/members">Members</Link>
          <Link href="/categories">Payment categories</Link>
          <Link href="/account">My account</Link>
        </nav>
      </aside>
      <div>
        <header>
          <span>{staff.label}</span>
          <form action={signOut}>
            <button className="secondary">Sign out</button>
          </form>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
