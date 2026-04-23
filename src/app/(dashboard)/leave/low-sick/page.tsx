import { DEFAULT_LOW_SICK_THRESHOLD, listLowSickLeave } from "@/lib/queries/leave";

type LowSickPageProps = {
  searchParams: Promise<{ threshold?: string }>;
};

export default async function LowSickLeavePage({ searchParams }: LowSickPageProps) {
  const resolved = await searchParams;
  const parsed = resolved.threshold ? Number(resolved.threshold) : DEFAULT_LOW_SICK_THRESHOLD;
  const threshold = Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_LOW_SICK_THRESHOLD;
  const rows = await listLowSickLeave(threshold);

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Low Sick Leave</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Employees with sick leave balance at or below the warning threshold ({threshold} days).
          </p>
          <p className="mt-1 text-xs text-neutral-500">Override with query <code className="rounded bg-neutral-100 px-1">?threshold=2</code>.</p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee ID</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Sick Leave Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">{row.employee_id}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.employee_name ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.department ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.sick_leave_balance}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-600">
              No employees at or below this sick leave threshold.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
