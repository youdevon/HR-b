import { redirect } from "next/navigation";

export default async function GratuityRulesPage({
  searchParams: _searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  redirect("/settings/gratuity-rules");
}
