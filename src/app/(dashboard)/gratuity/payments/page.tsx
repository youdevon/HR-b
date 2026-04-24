import Link from "next/link";
import { listGratuityPayments } from "@/lib/queries/gratuity";

export default async function GratuityPaymentsPage() {
  const rows = await listGratuityPayments();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Gratuity payments</h1>
            <p className="mt-1 text-sm text-neutral-600">Payment records linked to gratuity calculations.</p>
          </div>
          <Link
            href="/gratuity/calculations"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Calculations
          </Link>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Gratuity</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Payment status</th>
                  <th className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((r) => (
                  <tr key={r.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      {r.employee_id ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.gratuity_calculation_id ? (
                        <Link
                          href={`/gratuity/${r.gratuity_calculation_id}`}
                          className="font-mono text-xs text-neutral-900 hover:underline"
                        >
                          {r.gratuity_calculation_id}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {r.payment_amount != null ? String(r.payment_amount) : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{r.payment_status ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.created_at ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">No gratuity payments recorded yet.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
