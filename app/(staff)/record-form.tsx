"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import type { DirectoryKind, DirectoryRecord } from "@/lib/directory";
import { saveRecord } from "./directory-actions";

export function RecordForm({
  kind,
  record,
}: {
  kind: DirectoryKind;
  record?: DirectoryRecord;
}) {
  const member = kind === "members";
  const [status, setStatus] = useState(
    record?.active === false ? "inactive" : "active",
  );
  const [name, setName] = useState(record?.name ?? "");
  const [extra, setExtra] = useState(
    (member ? record?.phone : record?.group_name) ?? "",
  );
  const [reason, setReason] = useState(record?.inactive_reason ?? "");
  const [error, submit, pending] = useActionState(
    saveRecord.bind(null, kind, record?.id ?? null, record?.revision ?? 0),
    "",
  );
  return (
    <>
      <Link href={"/" + kind}>{member ? "Members" : "Payment categories"}</Link>
      <h1 className="page-title">
        {record ? "Edit" : "Add"} {member ? "member" : "category"}
      </h1>
      <form className="panel record" action={submit}>
        <label>
          {member ? "Full name" : "Category name"}
          <input
            name="name"
            required
            maxLength={120}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <label>
          {member ? "Phone (optional)" : "Group (optional)"}
          <input
            type={member ? "tel" : "text"}
            name="extra"
            maxLength={member ? 40 : 80}
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
          />
        </label>
        {record && (
          <>
            <label>
              Status
              <select
                name="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">
                  {member ? "Archived" : "Inactive"}
                </option>
              </select>
            </label>
            {status === "inactive" && (
              <label>
                {member ? "Reason for archiving" : "Reason for deactivation"}
                <input
                  name="reason"
                  required
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
            )}
          </>
        )}
        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}
        <div className="commands">
          <button disabled={pending}>
            {pending ? "Saving…" : "Save " + (member ? "member" : "category")}
          </button>
          <Link href={member && record ? "/members/" + record.id : "/" + kind}>
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
