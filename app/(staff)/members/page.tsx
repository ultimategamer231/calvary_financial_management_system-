import { DirectoryList, type Filters } from "../directory-list";
export default async function Directory({
  searchParams,
}: {
  searchParams: Promise<Filters>;
}) {
  return <DirectoryList kind="members" filters={await searchParams} />;
}
