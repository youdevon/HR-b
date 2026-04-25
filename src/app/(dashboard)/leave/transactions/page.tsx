import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  formatLeaveType,
  listLeaveTransactions,
  listLeaveTransactionsByEmployeeId,
} from "@/lib/queries/leave";

function formatDays(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
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
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
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
                    className="min-w-72 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                  >
                    Search
                  </button>
                  {query ? (
                    <Link
                      href="/leave/transactions"
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                    >
                      Clear
                    </Link>
                  ) : null}
                </form>
              ) : null}
              <Link
                href={employeeId ? `/leave/new?employeeId=${employeeId}` : "/leave/new"}
                className="inline-flex w-fit items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Apply Leave
              </Link>
            </>
          }
        />

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Employee #</th>
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
                      <Link href={`/leave/${row.id}`} className="hover:underline">
                        {row.employee_name ?? row.employee_id ?? "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.employee_number ?? "-"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {formatLeaveType(row.leave_type)}
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