import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  countEmployeesOnLeave,
  countPendingLeaveApprovals,
  formatLeaveType,
  generateLeaveWorkflowAlerts,
  listLeaveBalances,
  listLeaveTransactions,
  normalizeLeaveType,
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

export default async function LeavePage() {
  await generateLeaveWorkflowAlerts().catch(() => 0);
  const [transactions, balances, pendingCount, onLeaveCount] = await Promise.all([
    listLeaveTransactions(),
    listLeaveBalances(),
    countPendingLeaveApprovals(),
    countEmployeesOnLeave(),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const pendingApprovals = transactions
    .filter((row) => row.approval_status === "pending")
    .slice(0, 6);
  const employeesOnLeave = transactions
    .filter(
      (row) =>
        row.approval_status === "approved" &&
        (row.start_date ?? "") <= today &&
        (row.end_date ?? "") >= today
    )
    .slice(0, 6);
  const recentTransactions = transactions.slice(0, 8);
  const lowSickCount = balances.filter((row) => {
    const remaining = Number(row.remaining_days ?? 0);
    const threshold = Number(row.warning_threshold_days ?? 0);
    return normalizeLeaveType(row.leave_type ?? "") === "sick_leave" && row.low_balance_warning_enabled !== false && remaining <= threshold;
  }).length;
  const lowVacationCount = balances.filter((row) => {
    const remaining = Number(row.remaining_days ?? 0);
    const threshold = Number(row.warning_threshold_days ?? 0);
    return normalizeLeaveType(row.leave_type ?? "") === "vacation_leave" && row.low_balance_warning_enabled !== false && remaining <= threshold;
  }).length;

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Leave Management"
          description="Monitor leave approvals, active absences, balances, and recent activity."
          backHref="/dashboard"
          actions={
            <>
              <Link
                href="/leave/transactions"
                className="inline-flex w-fit items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                View Transactions
              </Link>
              <Link
                href="/leave/balances"
                className="inline-flex w-fit items-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                View Balances
              </Link>
              <Link
                href="/leave/new"
                className="inline-flex w-fit items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Apply Leave
              </Link>
            </>
          }
        />

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Pending Approvals" value={pendingCount} href="/leave/transactions?q=pending" />
          <MetricCard label="Employees Currently On Leave" value={onLeaveCount} href="/leave/transactions?q=approved" />
          <MetricCard label="Low Sick Leave" value={lowSickCount} href="/leave/low-sick" />
          <MetricCard label="Low Vacation Leave" value={lowVacationCount} href="/leave/low-vacation" />
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <OverviewTable title="Pending Approvals" rows={pendingApprovals} empty="No pending leave approvals." />
          <OverviewTable title="Employees Currently On Leave" rows={employeesOnLeave} empty="No employees are currently on leave." />
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
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
      </div>
    </main>
  );
}

function MetricCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-sm font-medium text-neutral-600">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-neutral-900">{value}</p>
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
    <div className={compact ? "" : "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6"}>
      {title ? <h2 className="text-lg font-semibold text-neutral-900">{title}</h2> : null}
      {rows.length ? (
        <div className={title ? "mt-4 overflow-x-auto" : "overflow-x-auto"}>
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Dates</th>
                <th className="px-4 py-3">Days</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-neutral-50">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                    <Link href={`/leave/${row.id}`} className="hover:underline">
                      {row.employee_name ?? row.employee_number ?? row.employee_id ?? "-"}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{formatLeaveType(row.leave_type)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {display(row.start_date)} - {display(row.end_date)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">{display(row.total_days)}</td>
                  <td className="whitespace-nowrap px-4 py-3">
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
