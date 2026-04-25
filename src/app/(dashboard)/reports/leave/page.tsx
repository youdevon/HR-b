import PageHeader from "@/components/layout/page-header";
import { getLeaveBalancesReport, getLeaveTransactionsReport } from "@/lib/queries/reports";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string { return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : ""; }
function display(value: string | number | null | undefined): string { return value === null || value === undefined || value === "" ? "—" : String(value); }

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    query: firstString(sp.q),
    leaveType: firstString(sp.leaveType),
    status: firstString(sp.status),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const [balances, transactions] = await Promise.all([
    getLeaveBalancesReport(filters),
    getLeaveTransactionsReport(filters),
  ]);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Leave report"
        description="Leave balances, utilization, and absence patterns for workforce planning."
        backHref="/reports"
        actions={<ExportButtons />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/leave" className="grid gap-3 md:grid-cols-5">
          <input name="q" defaultValue={filters.query} placeholder="Employee name or number" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <select name="leaveType" defaultValue={filters.leaveType} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"><option value="">All Leave Types</option><option value="vacation_leave">Vacation</option><option value="sick_leave">Sick</option><option value="casual_leave">Casual</option><option value="maternity_leave">Maternity</option><option value="paternity_leave">Paternity</option><option value="unpaid_leave">Unpaid</option><option value="special_leave">Special</option></select>
          <select name="status" defaultValue={filters.status} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"><option value="">All Statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="cancelled">Cancelled</option><option value="returned">Returned</option></select>
          <input name="startDate" type="date" defaultValue={filters.startDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="endDate" type="date" defaultValue={filters.endDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Run Report</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-5 py-4"><h2 className="text-sm font-semibold text-neutral-900">Leave Transactions</h2></div>
        {!transactions.length ? <p className="p-8 text-center text-sm text-neutral-600">No leave transactions match the selected filters.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Leave Type</th><th className="px-4 py-3">Dates</th><th className="px-4 py-3">Days</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Return</th></tr></thead><tbody className="divide-y divide-neutral-100">{transactions.map((row) => <tr key={row.id} className="hover:bg-neutral-50"><td className="px-4 py-3 font-medium text-neutral-900">{display(row.employee_name ?? row.employee_number)}</td><td className="px-4 py-3">{display(row.leave_type)}</td><td className="px-4 py-3">{display(row.start_date)} to {display(row.end_date)}</td><td className="px-4 py-3">{display(row.total_days ?? row.days)}</td><td className="px-4 py-3">{display(row.approval_status ?? row.status)}</td><td className="px-4 py-3">{display(row.return_to_work_date)}</td></tr>)}</tbody></table></div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <div className="border-b border-neutral-200 px-5 py-4"><h2 className="text-sm font-semibold text-neutral-900">Leave Balances</h2></div>
        {!balances.length ? <p className="p-8 text-center text-sm text-neutral-600">No leave balances match the selected filters.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-4 py-3">Employee ID</th><th className="px-4 py-3">Leave Type</th><th className="px-4 py-3">Year</th><th className="px-4 py-3">Entitlement</th><th className="px-4 py-3">Used</th><th className="px-4 py-3">Remaining</th><th className="px-4 py-3">Pending</th></tr></thead><tbody className="divide-y divide-neutral-100">{balances.map((row) => <tr key={row.id} className="hover:bg-neutral-50"><td className="px-4 py-3">{display(row.employee_id)}</td><td className="px-4 py-3">{display(row.leave_type)}</td><td className="px-4 py-3">{display(row.balance_year)}</td><td className="px-4 py-3">{display(row.entitlement_days)}</td><td className="px-4 py-3">{display(row.used_days)}</td><td className="px-4 py-3">{display(row.remaining_days)}</td><td className="px-4 py-3">{display(row.pending_days)}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}

function ExportButtons() { return <div className="flex gap-2"><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export Excel</button><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export PDF</button></div>; }
