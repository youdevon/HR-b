import PageHeader from "@/components/layout/page-header";
import { listLowVacationLeave } from "@/lib/queries/leave";

export default async function LowVacationLeavePage() {
  const rows = await listLowVacationLeave();

  return (
    <main className="space-y-6">
      <PageHeader
        title="Low Vacation Leave"
        description="Vacation leave balances at or below the warning threshold."
        backHref="/leave"
      />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">No low vacation leave records found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-3 py-3 font-medium">Employee ID</th>
                  <th className="px-3 py-3 font-medium">Year</th>
                  <th className="px-3 py-3 font-medium">Remaining</th>
                  <th className="px-3 py-3 font-medium">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-100">
                    <td className="px-3 py-3">{row.employee_id ?? "—"}</td>
                    <td className="px-3 py-3">{row.balance_year ?? "—"}</td>
                    <td className="px-3 py-3">{row.remaining_days ?? "—"}</td>
                    <td className="px-3 py-3">{row.warning_threshold_days ?? "—"}</td>
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