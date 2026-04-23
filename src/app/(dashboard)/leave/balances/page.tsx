import { listLeaveBalances } from "@/lib/queries/leave";

export default async function LeaveBalancesPage() {
  const rows = await listLeaveBalances();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Leave Balances</h1>
          <p className="mt-1 text-sm text-neutral-600">Current leave balances from the database.</p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Sick</th>
                  <th className="px-4 py-3">Vacation</th>
                  <th className="px-4 py-3">Casual</th>
                  <th className="px-4 py-3">Special</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">{row.employee_id}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.employee_name ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.sick_leave_balance}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.vacation_leave_balance}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.casual_leave_balance}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.special_leave_balance}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.updated_at ? new Date(row.updated_at).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-600">No leave balance records found.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
