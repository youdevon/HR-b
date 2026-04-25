import Link from "next/link";
import {
  generateLeaveWorkflowAlerts,
  listLeaveTransactions,
} from "@/lib/queries/leave";

type LeavePageProps = {
  searchParams: Promise<{
    q?: string;
    employeeId?: string;
  }>;
};

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

export default async function LeavePage({ searchParams }: LeavePageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const employeeId = params.employeeId?.trim() ?? "";
  await generateLeaveWorkflowAlerts().catch(() => 0);
  const rows = await listLeaveTransactions({ query: employeeId || query });

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Leave Management
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Apply, approve, reject, cancel, and return employees from leave.
              </p>
              {employeeId ? (
                <p className="mt-2 text-xs text-neutral-500">
                  Filtered by employee: {employeeId}
                </p>
              ) : null}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {!employeeId ? (
                <form className="flex gap-2" action="/leave">
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search employee name..."
                    className="min-w-64 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                  >
                    Search
                  </button>
                </form>
              ) : null}
              <Link
                href={employeeId ? `/leave/new?employeeId=${employeeId}` : "/leave/new"}
                className="inline-flex w-fit items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Apply Leave
              </Link>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Total Days</th>
                  <th className="px-4 py-3">Balance</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/leave/${row.id}`} className="hover:underline">
                        {row.employee_name ?? row.employee_id ?? "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{display(row.leave_type)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{display(row.start_date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{display(row.end_date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{display(row.total_days)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{display(row.balance_days)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(row.approval_status)}`}>
                        {row.approval_status ?? "unknown"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(row.return_to_work_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-8 text-center text-sm text-neutral-600">
              No leave records found.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
