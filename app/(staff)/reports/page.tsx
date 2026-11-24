import { ReportPage } from "./report-ui";
import type { Filter } from "@/lib/reports";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Filter>;
}) {
  return <ReportPage raw={await searchParams} />;
}
