import { requireStaff } from "@/lib/session";
export default async function Account() {
  const staff = await requireStaff();
  return (
    <>
      <h1>My account</h1>
      <dl className="panel">
        <dt>Staff assignment</dt>
        <dd>{staff.label}</dd>
        <dt>Email address</dt>
        <dd>{staff.email}</dd>
      </dl>
    </>
  );
}
