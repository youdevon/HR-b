import PageHeader from "@/components/layout/page-header";
import { listLowSickLeave } from "@/lib/queries/leave";
import { formatLeaveType } from "@/lib/queries/leave";

export default async function LowSickLeavePage() {
  const rows = await listLowSickLeave();

  return (
    <main className="space-y-6">
      <PageHeader
        title="Low Sick Leave"
        description="Sick leave balances at or below the warning threshold."
        backHref="/leave"
      />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">No low sick leave balances found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-3 py-3 font-medium">Employee</th>
                  <th className="px-3 py-3 font-medium">File #</th>
                  <th className="px-3 py-3 font-medium">Leave Type</th>
                  <th className="px-3 py-3 font-medium">Entitlement</th>
                  <th className="px-3 py-3 font-medium">Used</th>
                  <th className="px-3 py-3 font-medium">Remaining</th>
                  <th className="px-3 py-3 font-medium">Effective From</th>
                  <th className="px-3 py-3 font-medium">Effective To</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-100">
                    <td className="px-3 py-3">{row.employee_name ?? row.employee_id ?? "—"}</td>
                    <td className="px-3 py-3">{row.employee_file_number ?? "—"}</td>
                    <td className="px-3 py-3">{formatLeaveType(row.leave_type)}</td>
                    <td className="px-3 py-3">{row.entitlement_days ?? "—"}</td>
                    <td className="px-3 py-3">{row.used_days ?? "—"}</td>
                    <td className="px-3 py-3">{row.remaining_days ?? "—"}</td>
                    <td className="px-3 py-3">{row.effective_from ?? "—"}</td>
                    <td className="px-3 py-3">{row.effective_to ?? "—"}</td>
                    <td className="px-3 py-3">{row.employee_status ?? "—"}</td>
                    <td className="px-3 py-3">{row.threshold_days}</td>
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