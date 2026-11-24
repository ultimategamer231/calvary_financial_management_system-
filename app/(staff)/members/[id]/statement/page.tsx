import { ReportPage } from "../../../reports/report-ui";
import { readRecord } from "@/lib/directory";
import type { Filter } from "@/lib/reports";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Filter>;
}) {
  const m = await readRecord("members", (await params).id);
  return <ReportPage raw={await searchParams} member={m.id} name={m.name} />;
}
