import { listLeaveTransactions } from "@/lib/queries/leave";

function formatDays(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
}

export default async function LeaveTransactionsPage() {
  const rows = await listLeaveTransactions();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Leave Transactions
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Track leave debits, credits, and adjustments.
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Transaction</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      {row.employee_id ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.leave_type ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.transaction_type ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.start_date ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.end_date ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatDays(row.days)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.status ?? "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-600">
              No leave transactions found.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}