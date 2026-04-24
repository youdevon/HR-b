import Link from "next/link";
import { listCurrentCompensation, type CompensationRecord } from "@/lib/queries/compensation";

function salaryLabel(row: CompensationRecord): string {
  if (row.salary_amount === null || row.salary_amount === undefined || row.salary_amount === "") {
    return "—";
  }
  const cur = row.currency?.trim();
  return cur ? `${row.salary_amount} ${cur}` : String(row.salary_amount);
}

export default async function CompensationCurrentPage() {
  const rows = await listCurrentCompensation();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Current Compensation</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Active salary records from salary history.
            </p>
          </div>
          <Link
            href="/compensation/history"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            View history
          </Link>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Contract</th>
                  <th className="px-4 py-3">Salary</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Allowance</th>
                  <th className="px-4 py-3">Effective from</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      {row.employee_id ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.contract_id ? (
                        <Link href={`/contracts/${row.contract_id}`} className="text-neutral-900 hover:underline">
                          {row.contract_id}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/compensation/${row.id}`} className="font-medium text-neutral-900 hover:underline">
                        {salaryLabel(row)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.salary_frequency ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {row.allowance_amount != null && row.allowance_amount !== ""
                        ? `${row.allowance_amount}${row.currency ? ` ${row.currency}` : ""}`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.effective_from ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.compensation_status ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">
              No active compensation records. When a salary history row has compensation_status set to active, it
              will appear here.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
