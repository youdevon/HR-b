import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import EmptyStateCard from "@/components/ui/empty-state-card";
import { formatLeaveType, listLeaveBalances } from "@/lib/queries/leave";
import {
  dashboardPanelClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";

export default async function LeaveBalancesPage() {
  const rows = await listLeaveBalances();

  return (
    <main className="space-y-6">
      <PageHeader
        title="Leave Balances"
        description="Review yearly leave balances by contract period. Vacation and sick leave do not roll over."
        backHref="/leave"
      />

      {rows.length === 0 ? (
        <EmptyStateCard>No records found for the selected criteria.</EmptyStateCard>
      ) : (
        <div className={dashboardPanelClass}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className={dashboardTableHeadCellClass}>Employee</th>
                  <th className={dashboardTableHeadCellClass}>Leave Type</th>
                  <th className={dashboardTableHeadCellClass}>Balance Year</th>
                  <th className={dashboardTableHeadCellClass}>Effective From</th>
                  <th className={dashboardTableHeadCellClass}>Effective To</th>
                  <th className={dashboardTableHeadCellClass}>Entitlement</th>
                  <th className={dashboardTableHeadCellClass}>Used</th>
                  <th className={dashboardTableHeadCellClass}>Remaining</th>
                  <th className={dashboardTableHeadCellClass}>No Rollover</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className={dashboardTableBodyRowClass}>
                    <td className={dashboardTableCellClass}>{row.employee_id ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{formatLeaveType(row.leave_type)}</td>
                    <td className={dashboardTableCellClass}>{row.balance_year ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{row.effective_from ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{row.effective_to ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{row.entitlement_days ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{row.used_days ?? "—"}</td>
                    <td className={dashboardTableCellClass}>{row.remaining_days ?? "—"}</td>
                    <td className={dashboardTableCellClass}>Yes</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}