import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { cn } from "@/lib/utils/cn";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import {
  dashboardButtonPrimaryClass,
  dashboardButtonSecondaryClass,
  dashboardPanelMdClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";
import {
  countEmployeesOnLeave,
  countPendingLeaveApprovals,
  formatReadableDate,
  formatLeaveType,
  generateLeaveWorkflowAlerts,
  listLowSickLeave,
  listLowVacationLeave,
  listLeaveTransactions,
} from "@/lib/queries/leave";

function display(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function statusClass(status: string | null): string {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "approved") return "bg-emerald-100 text-emerald-700";
  if (normalized === "pending") return "bg-amber-100 text-amber-700";
  if (normalized === "rejected") return "bg-rose-100 text-rose-700";
  if (normalized === "cancelled") return "bg-neutral-100 text-neutral-700";
  if (normalized === "returned") return "bg-sky-100 text-sky-700";
  return "bg-neutral-100 text-neutral-700";
}

function dayWord(count: number, leaveType: "vacation" | "sick"): string {
  const unit = leaveType === "vacation" ? "vacation" : "sick";
  return count === 1 ? `1 more ${unit} day remaining.` : `${count} more ${unit} days remaining.`;
}

export default async function LeavePage() {
  await requirePermission("leave.view");
  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];
  const canCreateLeave = hasAnyPermissionForContext(profile, permissions, ["leave.create"]);
  const canViewTransactions = hasAnyPermissionForContext(profile, permissions, ["leave.transactions.view"]);
  const canViewBalances = hasAnyPermissionForContext(profile, permissions, ["leave.balances.view"]);
  await generateLeaveWorkflowAlerts().catch(() => 0);
  const [transactions, pendingCount, onLeaveCount, lowSickRows, lowVacationRows] = await Promise.all([
    listLeaveTransactions(),
    countPendingLeaveApprovals(),
    countEmployeesOnLeave(),
    listLowSickLeave(),
    listLowVacationLeave(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const pendingApprovals = transactions
    .filter((row) => row.approval_status === "pending")
    .slice(0, 6);
  const allEmployeesOnLeave = transactions
    .filter(
      (row) =>
        row.approval_status === "approved" &&
        (row.start_date ?? "") <= today &&
        (row.end_date ?? "") >= today
    );
  const employeesOnLeave = allEmployeesOnLeave
    .slice(0, 6);
  const recentTransactions = transactions.slice(0, 8);
  const lowSickCount = lowSickRows.length;
  const lowVacationCount = lowVacationRows.length;
  const sampleLowVacation = lowVacationRows[0];
  const sampleLowSick = lowSickRows[0];
  const lowVacationMessage = sampleLowVacation
    ? `${sampleLowVacation.employee_name ?? "Employee"} has ${dayWord(Number(sampleLowVacation.remaining_days ?? 0), "vacation")}`
    : "No current records.";
  const lowSickMessage = sampleLowSick
    ? `${sampleLowSick.employee_name ?? "Employee"} has ${dayWord(Number(sampleLowSick.remaining_days ?? 0), "sick")}`
    : "No current records.";

  return (
    <main className="space-y-6">
      <PageHeader
        title="Leave Management"
        description="Monitor leave approvals, active absences, balances, and recent activity."
        backHref="/dashboard"
        actions={
          <>
            {canViewTransactions ? (
              <Link href="/leave/transactions" className={cn(dashboardButtonSecondaryClass, "w-full sm:w-auto")}>
                View Transactions
              </Link>
            ) : null}
            {canViewBalances ? (
              <Link href="/leave/balances" className={cn(dashboardButtonSecondaryClass, "w-full sm:w-auto")}>
                View Balances
              </Link>
            ) : null}
            {canCreateLeave ? (
              <Link href="/leave/new" className={cn(dashboardButtonPrimaryClass, "w-full sm:w-auto")}>
                Apply Leave
              </Link>
            ) : null}
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Pending Approvals" value={pendingCount} href="/leave/transactions?q=pending" emptyText="No current records." />
          <MetricCard label="Currently on Leave" value={onLeaveCount} href="/leave/transactions?q=approved" emptyText="No current records." />
          <MetricCard label="Low Vacation Leave" value={lowVacationCount} href="/leave/low-vacation" detail={lowVacationMessage} emptyText="No current records." />
          <MetricCard label="Low Sick Leave" value={lowSickCount} href="/leave/low-sick" detail={lowSickMessage} emptyText="No current records." />
          <MetricCard label="Recent Leave Transactions" value={transactions.length} href="/leave/transactions" emptyText="No current records." />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
          <OverviewTable title="Pending Approvals" rows={pendingApprovals} empty="No pending leave approvals." />
          <OverviewTable title="Employees Currently On Leave" rows={employeesOnLeave} empty="No employees are currently on leave." />
      </section>

      <section className={dashboardPanelMdClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Recent Leave Transactions</h2>
          <Link href="/leave/transactions" className="text-sm font-medium text-neutral-700 hover:text-neutral-900">
            View all
          </Link>
        </div>
        <div className="mt-4">
          <OverviewTable rows={recentTransactions} empty="No recent leave transactions." compact />
        </div>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  href,
  detail,
  emptyText,
}: {
  label: string;
  value: number;
  href: string;
  detail?: string;
  emptyText?: string;
}) {
  return (
    <Link href={href} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-neutral-900">{value}</p>
      <p className="mt-2 text-xs text-neutral-600">{value > 0 ? (detail ?? "Current records available.") : (emptyText ?? "No current records.")}</p>
    </Link>
  );
}

function OverviewTable({
  title,
  rows,
  empty,
  compact = false,
}: {
  title?: string;
  rows: Awaited<ReturnType<typeof listLeaveTransactions>>;
  empty: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : dashboardPanelMdClass}>
      {title ? <h2 className="text-lg font-semibold text-neutral-900">{title}</h2> : null}
      {rows.length ? (
        <div className={title ? "mt-4 overflow-x-auto" : "overflow-x-auto"}>
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead>
              <tr className={dashboardTableHeadRowClass}>
                <th className={dashboardTableHeadCellClass}>Employee</th>
                <th className={dashboardTableHeadCellClass}>Type</th>
                <th className={dashboardTableHeadCellClass}>Dates</th>
                <th className={dashboardTableHeadCellClass}>Days</th>
                <th className={dashboardTableHeadCellClass}>Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
              {rows.map((row) => (
                <tr key={row.id} className={dashboardTableBodyRowClass}>
                  <td className={`whitespace-nowrap ${dashboardTableCellClass} font-medium text-neutral-900`}>
                    <Link href={`/leave/${row.id}`} className="hover:underline">
                      {row.employee_name ?? row.employee_number ?? row.employee_id ?? "-"}
                    </Link>
                  </td>
                  <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>
                    {formatLeaveType(row.leave_type)}
                  </td>
                  <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>
                    {formatReadableDate(row.start_date)} - {formatReadableDate(row.end_date)}
                  </td>
                  <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>{display(row.total_days)}</td>
                  <td className={`whitespace-nowrap ${dashboardTableCellClass}`}>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(row.approval_status)}`}>
                      {row.approval_status ?? "unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={title ? "mt-4 text-sm text-neutral-600" : "text-sm text-neutral-600"}>{empty}</p>
      )}
    </div>
  );
}
