import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import ClickableTableRow from "@/components/ui/clickable-table-row";
import EmptyStateCard from "@/components/ui/empty-state-card";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import {
  generateOverdueCheckedOutFileAlerts,
  listFileMovements,
} from "@/lib/queries/file-movements";
import {
  dashboardButtonPrimaryClass,
  dashboardButtonSecondaryClass,
  dashboardFieldClass,
  dashboardPanelClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";
import { cn } from "@/lib/utils/cn";

type FileMovementsPageProps = {
  searchParams: Promise<{
    employeeId?: string;
    q?: string;
  }>;
};

function statusTone(status: string | null): string {
  switch (status) {
    case "checked_out":
      return "bg-amber-100 text-amber-800";
    case "in_transit":
    case "transferred":
      return "bg-sky-100 text-sky-800";
    case "returned":
      return "bg-emerald-100 text-emerald-800";
    case "archived":
      return "bg-neutral-100 text-neutral-700";
    case "missing":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default async function FileMovementsPage({
  searchParams,
}: FileMovementsPageProps) {
  await requirePermission("files.view");
  const auth = await getDashboardSession();
  const canMoveFiles = hasAnyPermissionForContext(
    auth?.profile ?? null,
    auth?.permissions ?? [],
    ["files.move", "employee.file.move"]
  );
  const sp = await searchParams;
  const employeeId = sp.employeeId?.trim() ?? "";
  const query = sp.q?.trim() ?? "";

  const [movements, overdueCount] = await Promise.all([
    listFileMovements({ employeeId: employeeId || undefined, query }),
    generateOverdueCheckedOutFileAlerts(),
  ]);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Physical File Movements"
        description={
          employeeId
            ? `End-to-end workflow for check out, transfer, return, archive, and missing-file actions. Filtered by employee: ${employeeId}`
            : "End-to-end workflow for check out, transfer, return, archive, and missing-file actions."
        }
        backHref="/dashboard"
        actions={
          <>
            {!employeeId ? (
              <form action="/file-movements" className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search employee, file, location, status..."
                  className={cn(dashboardFieldClass, "min-w-72")}
                />
                <button type="submit" className={dashboardButtonSecondaryClass}>
                  Search
                </button>
                {query ? (
                  <Link href="/file-movements" className={dashboardButtonSecondaryClass}>
                    Clear
                  </Link>
                ) : null}
              </form>
            ) : null}
            {canMoveFiles ? (
              <Link
                href={employeeId ? `/file-movements/new?employeeId=${employeeId}` : "/file-movements/new"}
                className={cn(dashboardButtonPrimaryClass, "w-full sm:w-auto")}
              >
                New Movement
              </Link>
            ) : null}
          </>
        }
      />
      {overdueCount > 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {overdueCount} overdue checked-out file alert(s) generated.
        </p>
      ) : null}

      {movements.length === 0 ? (
        <EmptyStateCard>No records found for the selected criteria.</EmptyStateCard>
      ) : (
        <section className={cn(dashboardPanelClass, "overflow-hidden p-0")}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className={`${dashboardTableHeadCellClass} text-left`}>Employee</th>
                  <th className={`${dashboardTableHeadCellClass} text-left`}>File #</th>
                  <th className={`${dashboardTableHeadCellClass} text-left`}>Holder</th>
                  <th className={`${dashboardTableHeadCellClass} text-left`}>Location</th>
                  <th className={`${dashboardTableHeadCellClass} text-left`}>Sent</th>
                  <th className={`${dashboardTableHeadCellClass} text-left`}>Received</th>
                  <th className={`${dashboardTableHeadCellClass} text-left`}>Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((movement) => (
                  <ClickableTableRow key={movement.id} href={`/file-movements/${movement.id}`} className="align-top">
                    <td className={dashboardTableCellClass}>
                      <div className="font-medium text-neutral-900">
                        {movement.employee_name ?? movement.employee_id ?? "—"}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {movement.employee_number ?? "No employee #"}
                      </div>
                    </td>
                    <td className={dashboardTableCellClass}>{movement.file_number ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{movement.current_holder ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{movement.current_location ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{movement.date_sent ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{movement.date_received ?? "—"}</td>
                    <td className={dashboardTableCellClass}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(
                          movement.movement_status
                        )}`}
                      >
                        {movement.movement_status ?? "unknown"}
                      </span>
                    </td>
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}