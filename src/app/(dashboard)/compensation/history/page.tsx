import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { listCompensationHistory } from "@/lib/queries/compensation";

export default async function CompensationHistoryPage() {
  const rows = await listCompensationHistory();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Compensation History"
          description="All salary history records, newest first."
          backHref="/compensation/current"
          actions={
          <Link
            href="/compensation/current"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Current only
          </Link>
          }
        />

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Change</th>
                  <th className="px-4 py-3">Salary</th>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Effective from</th>
                  <th className="px-4 py-3">Effective to</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      {row.employee_id ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.change_type ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/compensation/${row.id}`} className="font-medium text-neutral-900 hover:underline">
                        {row.salary_amount != null && row.salary_amount !== ""
                          ? `${row.salary_amount}${row.currency ? ` ${row.currency}` : ""}`
                          : "—"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.salary_frequency ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.compensation_status ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.effective_from ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.effective_to ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">No compensation history yet.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
