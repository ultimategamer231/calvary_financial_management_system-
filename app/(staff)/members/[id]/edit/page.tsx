import { RecordForm } from "../../../record-form";
import { readRecord } from "@/lib/directory";
export default async function Edit({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const record = await readRecord("members", (await params).id);
  return <RecordForm kind="members" record={record} />;
}
