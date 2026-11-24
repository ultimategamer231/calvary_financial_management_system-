import Link from "next/link";
import { readRecord } from "@/lib/directory";
export default async function Member({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const member = await readRecord("members", (await params).id);
  return (
    <>
      <Link href="/members">Members</Link>
      <div className="title-row">
        <h1>{member.name}</h1>
        <Link className="action" href={"/members/" + member.id + "/edit"}>
          Edit member
        </Link>
      </div>
      {(await searchParams).saved === "1" && (
        <p className="notice" role="status">
          Member saved.
        </p>
      )}
      <dl className="panel">
        <dt>Member ID</dt>
        <dd>{member.member_number}</dd>
        <dt>Phone</dt>
        <dd>{member.phone || "No phone recorded"}</dd>
        <dt>Status</dt>
        <dd>{member.active ? "Active" : "Archived"}</dd>
        {!member.active && (
          <>
            <dt>Reason for archiving</dt>
            <dd>{member.inactive_reason}</dd>
          </>
        )}
      </dl>
      <p>
        <Link href={"/members/" + member.id + "/statement"}>
          Contribution history and printable statement
        </Link>
      </p>
    </>
  );
}
