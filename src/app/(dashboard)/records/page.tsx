import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { listRecords, listRecordsByEmployeeId } from "@/lib/queries/records";

type RecordsPageProps = {
  searchParams: Promise<{ q?: string; employeeId?: string }>;
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  await requirePermission("records.view");
  const auth = await getDashboardSession();
  const canCreateRecord = hasAnyPermissionForContext(
    auth?.profile ?? null,
    auth?.permissions ?? [],
    ["records.create"]
  );
  const resolved = await searchParams;
  const query = resolved.q?.trim() ?? "";
  const employeeId = resolved.employeeId?.trim() ?? "";

  const records = employeeId
    ? await listRecordsByEmployeeId(employeeId)
    : await listRecords({ query });

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Record Keeping"
          description={
            employeeId
              ? `General HR records across employee files, compliance, and operational notes. Filtered by employee: ${employeeId}`
              : "General HR records across employee files, compliance, and operational notes."
          }
          backHref="/dashboard"
          actions={
            <>
            {!employeeId ? (
              <form className="w-full sm:w-80" method="get">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search title, type, category, reference..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                />
              </form>
            ) : null}
            {canCreateRecord ? (
              <Link
                href={employeeId ? `/records/new?employeeId=${employeeId}` : "/records/new"}
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                New Record
              </Link>
            ) : null}
            </>
          }
        />

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Record Date</th>
                  <th className="px-4 py-3">Reference #</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {records.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td
                      className="max-w-[260px] truncate px-4 py-3 font-medium text-neutral-900"
                      title={row.record_title ?? undefined}
                    >
                      <Link href={`/records/${row.id}`} className="hover:underline">
                        {row.record_title ?? "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.record_type ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.record_category ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.employee_id ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.record_date ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.reference_number ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.status ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!records.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">
              {query ? "No records match your search." : "No records found yet."}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
