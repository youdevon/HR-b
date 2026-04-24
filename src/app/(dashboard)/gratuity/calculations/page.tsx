import Link from "next/link";
import { listGratuityCalculations } from "@/lib/queries/gratuity";

export default async function GratuityCalculationsPage() {
  const rows = await listGratuityCalculations();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Gratuity calculations</h1>
            <p className="mt-1 text-sm text-neutral-600">All gratuity calculation records.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/gratuity/rules"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Rules
            </Link>
            <Link
              href="/gratuity/payments"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Payments
            </Link>
            <Link
              href="/gratuity/pending-review"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Pending review
            </Link>
            <Link
              href="/gratuity/approved-unpaid"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Approved unpaid
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Calculated amount</th>
                  <th className="px-4 py-3">Calculation date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/gratuity/${r.id}`} className="hover:underline">
                        {r.employee_id ?? "—"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{r.calculation_status ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.calculated_amount != null ? String(r.calculated_amount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{r.calculation_date ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">No gratuity calculations yet.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
