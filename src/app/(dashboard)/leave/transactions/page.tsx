import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import ClickableTableRow from "@/components/ui/clickable-table-row";
import EmptyStateCard from "@/components/ui/empty-state-card";
import {
  formatLeaveType,
  formatReadableDate,
  listLeaveTransactions,
  listLeaveTransactionsByEmployeeId,
} from "@/lib/queries/leave";
import {
  dashboardButtonPrimaryClass,
  dashboardButtonSecondaryClass,
  dashboardFieldClass,
  dashboardPanelClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";

function formatDays(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "active" || normalized === "approved") return "bg-emerald-100 text-emerald-800";
  if (normalized === "pending" || normalized === "warning") return "bg-amber-100 text-amber-800";
  if (normalized === "rejected" || normalized === "critical" || normalized === "expired") return "bg-red-100 text-red-800";
  if (normalized === "inactive" || normalized === "resolved" || normalized === "cancelled") return "bg-neutral-100 text-neutral-700";
  return "bg-neutral-100 text-neutral-700";
}

type LeaveTransactionsPageProps = {
  searchParams: Promise<{
    employeeId?: string;
    q?: string;
  }>;
};

export default async function LeaveTransactionsPage({
  searchParams,
}: LeaveTransactionsPageProps) {
  const params = await searchParams;
  const employeeId = params.employeeId?.trim() ?? "";
  const query = params.q?.trim() ?? "";
  const rows = employeeId
    ? await listLeaveTransactionsByEmployeeId(employeeId)
    : await listLeaveTransactions({ query });

  return (
    <main className="space-y-6">
        <PageHeader
          title="Leave Transactions"
          description={
            employeeId
              ? `Search and track leave applications, approvals, cancellations, and returns. Filtered by employee: ${employeeId}`
              : "Search and track leave applications, approvals, cancellations, and returns."
          }
          backHref="/leave"
          actions={
            <>
              {!employeeId ? (
                <form action="/leave/transactions" className="flex flex-col gap-2 sm:flex-row">
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search employee, number, type, status..."
                    className={`min-w-72 ${dashboardFieldClass}`}
                  />
                  <button
                    type="submit"
                    className={dashboardButtonSecondaryClass}
                  >
                    Search
                  </button>
                  {query ? (
                    <Link
                      href="/leave/transactions"
                      className={dashboardButtonSecondaryClass}
                    >
                      Clear
                    </Link>
                  ) : null}
                </form>
              ) : null}
              <Link
                href={employeeId ? `/leave/new?employeeId=${employeeId}` : "/leave/new"}
                className={`inline-flex w-fit items-center ${dashboardButtonPrimaryClass}`}
              >
                Apply Leave
              </Link>
            </>
          }
        />

        <section className={`overflow-hidden ${dashboardPanelClass} p-0`}>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className={dashboardTableHeadCellClass}>Employee</th>
                  <th className={dashboardTableHeadCellClass}>Employee #</th>
                  <th className={dashboardTableHeadCellClass}>Leave Type</th>
                  <th className={dashboardTableHeadCellClass}>Transaction</th>
                  <th className={dashboardTableHeadCellClass}>Start</th>
                  <th className={dashboardTableHeadCellClass}>End</th>
                  <th className={dashboardTableHeadCellClass}>Days</th>
                  <th className={dashboardTableHeadCellClass}>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((row) => (
                  <ClickableTableRow key={row.id} href={`/leave/${row.id}`}>
                    <td className={`${dashboardTableCellClass} whitespace-nowrap font-medium text-neutral-900`}>
                      {row.employee_name ?? row.employee_id ?? "-"}
                    </td>
                    <td className={`${dashboardTableCellClass} whitespace-nowrap`}>
                      {row.employee_number ?? "-"}
                    </td>
                    <td className={`${dashboardTableCellClass} whitespace-nowrap`}>
                      {formatLeaveType(row.leave_type)}
                    </td>
                    <td className={`${dashboardTableCellClass} whitespace-nowrap`}>
                      {row.transaction_type ?? "-"}
                    </td>
                    <td className={`${dashboardTableCellClass} whitespace-nowrap`}>
                      {formatReadableDate(row.start_date)}
                    </td>
                    <td className={`${dashboardTableCellClass} whitespace-nowrap`}>
                      {formatReadableDate(row.end_date)}
                    </td>
                    <td className={`${dashboardTableCellClass} whitespace-nowrap`}>
                      {formatDays(row.days)}
                    </td>
                    <td className={`${dashboardTableCellClass} whitespace-nowrap`}>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(row.status)}`}>
                        {row.status ?? "-"}
                      </span>
                    </td>
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <EmptyStateCard className="m-4">No records found for the selected criteria.</EmptyStateCard>
          ) : null}
        </section>
    
    </main>
  );
}