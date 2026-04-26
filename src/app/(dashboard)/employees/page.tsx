import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import ClickableTableRow from "@/components/ui/clickable-table-row";
import EmptyStateCard from "@/components/ui/empty-state-card";
import ToastMessage from "@/components/ui/toast-message";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { listEmployees } from "@/lib/queries/employees";
import {
  dashboardButtonSecondaryClass,
  dashboardFieldClass,
  dashboardHeaderActionPrimaryClass,
  dashboardHeaderActionSecondaryClass,
  dashboardPanelClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";

type EmployeesPageProps = {
  searchParams: Promise<{
    q?: string;
    show?: string;
    created?: string;
  }>;
};

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "active") return "bg-emerald-100 text-emerald-800";
  if (normalized === "pending" || normalized === "warning") return "bg-amber-100 text-amber-800";
  if (normalized === "expired" || normalized === "critical") return "bg-red-100 text-red-800";
  if (normalized === "inactive" || normalized === "resolved" || normalized === "archived") {
    return "bg-neutral-100 text-neutral-700";
  }
  return "bg-neutral-100 text-neutral-700";
}

export default async function EmployeesPage({
  searchParams,
}: EmployeesPageProps) {
  await requirePermission("employees.view");
  const auth = await getDashboardSession();
  const canCreateEmployee = hasAnyPermissionForContext(
    auth?.profile ?? null,
    auth?.permissions ?? [],
    ["employees.create"]
  );
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const showAll = params?.show === "all";
  const created = params?.created === "1";
  const shouldShowEmployees = Boolean(query) || showAll;

  const employees = shouldShowEmployees ? await listEmployees({ query }) : [];

  return (
    <main className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee records and physical file details."
        backHref="/dashboard"
        actions={
          <>
          <Link href="/employees?show=all" className={dashboardHeaderActionSecondaryClass}>
            Show All
          </Link>
          {canCreateEmployee ? (
            <Link href="/employees/new" className={dashboardHeaderActionPrimaryClass}>
              New Employee
            </Link>
          ) : null}
          </>
        }
      />

      {created ? (
        <ToastMessage message="Employee created successfully." />
      ) : null}

      <div className={dashboardPanelClass}>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center" method="get">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by name, file number, employee number, department..."
            className={dashboardFieldClass}
          />

          <button type="submit" className={dashboardButtonSecondaryClass}>
            Search
          </button>

          {query || showAll ? (
            <Link href="/employees" className={dashboardButtonSecondaryClass}>
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {!shouldShowEmployees ? (
        <EmptyStateCard>Use search or select a filter to view records.</EmptyStateCard>
      ) : employees.length === 0 ? (
        <EmptyStateCard>
          No records found for the selected criteria.
        </EmptyStateCard>
      ) : (
        <div className={dashboardPanelClass}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className={dashboardTableHeadCellClass}>Employee #</th>
                  <th className={dashboardTableHeadCellClass}>File #</th>
                  <th className={dashboardTableHeadCellClass}>Name</th>
                  <th className={dashboardTableHeadCellClass}>Department</th>
                  <th className={dashboardTableHeadCellClass}>Job Title</th>
                  <th className={dashboardTableHeadCellClass}>Status</th>
                  <th className={dashboardTableHeadCellClass}>File Status</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <ClickableTableRow
                    key={employee.id}
                    href={`/employees/${employee.id}`}
                  >
                    <td className={dashboardTableCellClass}>{employee.employee_number ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{employee.file_number ?? "—"}</td>
                    <td className={dashboardTableCellClass}>
                      {employee.first_name ?? ""} {employee.last_name ?? ""}
                    </td>
                    <td className={dashboardTableCellClass}>{employee.department ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{employee.job_title ?? "—"}</td>
                    <td className={dashboardTableCellClass}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(employee.employment_status)}`}>
                        {employee.employment_status ?? "—"}
                      </span>
                    </td>
                    <td className={dashboardTableCellClass}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(employee.file_status)}`}>
                        {employee.file_status ?? "—"}
                      </span>
                    </td>
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}