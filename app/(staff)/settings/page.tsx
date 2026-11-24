import { database } from "@/lib/session";
import { SettingsForms } from "./forms";
import Link from "next/link";
export default async function Page() {
  const db = await database();
  const [profile, methods, roster] = await Promise.all([
    db.from("church_profile").select("*").single(),
    db.from("payment_methods").select("*").order("name"),
    db.rpc("account_roster"),
  ]);
  if (!profile.data || !methods.data || !roster.data)
    throw Error("Unable to load settings");
  return (
    <>
      <h1>Settings</h1>
      <SettingsForms profile={profile.data} methods={methods.data} />
      <section className="panel">
        <h2>Staff accounts</h2>
        {roster.data.map((r) => (
          <p key={r.slot}>
            {r.slot} · {r.email || "Unassigned"}
          </p>
        ))}
        <p>
          Contact the church account operator to replace an assigned account.
        </p>
        <Link href="/account/password">Change my password</Link>
      </section>
      <section className="panel">
        <h2>Financial settings</h2>
        <p>
          USD and LRD are recorded and reported separately. Business dates
          follow Africa/Monrovia.
        </p>
        <Link href="/categories">Manage payment categories</Link>
      </section>
    </>
  );
}
