import { OfflineStatus } from "@/app/offline/status";
import { SubmitButton } from "@/app/submit-button";
import { Seal } from "@/app/seal";
import { requireStaff } from "@/lib/session";
import { signOut } from "../actions";
import { WorkspaceNav } from "./workspace-nav";
import "./workspace.css";

export const dynamic = "force-dynamic";

export default async function Workspace({ children }: { children: React.ReactNode }) {
  const staff = await requireStaff();
  return (
    <div className="workspace">
      <a className="workspace-skip" href="#workspace-content">Skip to content</a>
      <aside className="workspace-rail">
        <div className="workspace-identity">
          <Seal size={48} />
          <span>Calvary <span className="church-name">Baptist Church</span></span>
        </div>
        <WorkspaceNav />
      </aside>
      <div>
        <header className="workspace-bar">
          <span className="workspace-title">Financial Management System</span>
          <span className="workspace-user">Signed in as {staff.label}.</span>
          <form action={signOut}>
            <SubmitButton label="Sign out" busyLabel="Signing out…" hint="End this staff session." secondary />
          </form>
        </header>
        <section aria-label="Offline collection access"><OfflineStatus owner={staff.id} /></section>
        <main id="workspace-content" tabIndex={-1} className="content">{children}</main>
      </div>
    </div>
  );
}
