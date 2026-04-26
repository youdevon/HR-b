import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import EmptyStateCard from "@/components/ui/empty-state-card";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { listRecords, listRecordsByEmployeeId } from "@/lib/queries/records";
import {
  dashboardButtonPrimaryClass,
  dashboardFieldClass,
  dashboardPanelClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";
import { cn } from "@/lib/utils/cn";

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
    <main className="space-y-6">
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
              <form className="w-full sm:max-w-md" method="get">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search title, type, category, reference..."
                  className={dashboardFieldClass}
                />
              </form>
            ) : null}
            {canCreateRecord ? (
              <Link
                href={employeeId ? `/records/new?employeeId=${employeeId}` : "/records/new"}
                className={cn(dashboardButtonPrimaryClass, "w-full sm:w-auto")}
              >
                New Record
              </Link>
            ) : null}
          </>
        }
      />

      {records.length === 0 ? (
        <EmptyStateCard>
          {query ? "No records match your search." : "No records found yet."}
        </EmptyStateCard>
      ) : (
        <section className={cn(dashboardPanelClass, "overflow-hidden p-0")}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className={dashboardTableHeadCellClass}>Title</th>
                  <th className={dashboardTableHeadCellClass}>Type</th>
                  <th className={dashboardTableHeadCellClass}>Category</th>
                  <th className={dashboardTableHeadCellClass}>Employee</th>
                  <th className={dashboardTableHeadCellClass}>Record Date</th>
                  <th className={dashboardTableHeadCellClass}>Reference #</th>
                  <th className={dashboardTableHeadCellClass}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {records.map((row) => (
                  <tr key={row.id} className={dashboardTableBodyRowClass}>
                    <td
                      className={cn("max-w-[260px] truncate font-medium text-neutral-900", dashboardTableCellClass)}
                      title={row.record_title ?? undefined}
                    >
                      <Link href={`/records/${row.id}`} className="hover:underline">
                        {row.record_title ?? "-"}
                      </Link>
                    </td>
                    <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>{row.record_type ?? "-"}</td>
                    <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>
                      {row.record_category ?? "-"}
                    </td>
                    <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>{row.employee_id ?? "-"}</td>
                    <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>{row.record_date ?? "-"}</td>
                    <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>
                      {row.reference_number ?? "-"}
                    </td>
                    <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>{row.status ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
