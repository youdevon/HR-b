import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { cn } from "@/lib/utils/cn";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import {
  dashboardButtonPrimaryClass,
  dashboardButtonSecondaryClass,
} from "@/lib/ui/dashboard-styles";
import {
  countEmployeesOnLeave,
  countPendingLeaveApprovals,
  generateLeaveWorkflowAlerts,
  listLeaveBalances,
  listLowSickLeave,
  listLowVacationLeave,
  listLeaveTransactions,
} from "@/lib/queries/leave";

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
  const canViewBalances = hasAnyPermissionForContext(profile, permissions, ["leave.balances.view"]);
  await generateLeaveWorkflowAlerts().catch(() => 0);
  const [transactions, balances, pendingCount, onLeaveCount, lowSickRows, lowVacationRows] = await Promise.all([
    listLeaveTransactions(),
    listLeaveBalances(),
    countPendingLeaveApprovals(),
    countEmployeesOnLeave(),
    listLowSickLeave(),
    listLowVacationLeave(),
  ]);

  const balancesCount = balances.length;
  const transactionsCount = transactions.length;
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <MetricCard label="Pending Approvals" value={pendingCount} href="/leave/transactions?q=pending" emptyText="No current records." />
          <MetricCard label="Employees Currently On Leave" value={onLeaveCount} href="/leave/transactions?q=approved" emptyText="No current records." />
          <MetricCard label="Low Vacation Leave" value={lowVacationCount} href="/leave/low-vacation" detail={lowVacationMessage} emptyText="No current records." />
          <MetricCard label="Low Sick Leave" value={lowSickCount} href="/leave/low-sick" detail={lowSickMessage} emptyText="No current records." />
          <MetricCard label="Leave Balances" value={balancesCount} href="/leave/balances" emptyText="No current records." />
          <MetricCard label="Leave Transactions" value={transactionsCount} href="/leave/transactions" emptyText="No current records." />
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
    <Link
      href={href}
      className="min-h-[140px] rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:bg-neutral-50"
    >
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-neutral-900">{value}</p>
      <p className="mt-2 text-xs text-neutral-500">{value > 0 ? (detail ?? "Current records available.") : (emptyText ?? "No current records.")}</p>
    </Link>
  );
}
