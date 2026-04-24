import Link from "next/link";
import { notFound } from "next/navigation";
import { getGratuityById } from "@/lib/queries/gratuity";

type GratuityDetailPageProps = {
  params: Promise<{ id: string }>;
};

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default async function GratuityDetailPage({ params }: GratuityDetailPageProps) {
  const { id } = await params;
  const row = await getGratuityById(id);

  if (!row) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Gratuity calculation</h1>
            <p className="mt-1 font-mono text-xs text-neutral-500">{row.id}</p>
            <p className="mt-2 text-sm font-medium text-neutral-800">{cell(row.calculation_status)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/gratuity/calculations"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              All calculations
            </Link>
            <Link
              href="/gratuity/payments"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Payments
            </Link>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Employee</p>
              <p className="mt-1 text-sm text-neutral-900">{cell(row.employee_id)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Calculated</p>
              <p className="mt-1 text-sm text-neutral-900">{cell(row.calculated_amount)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Reviewed</p>
              <p className="mt-1 text-sm text-neutral-900">{cell(row.reviewed_amount)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Approved</p>
              <p className="mt-1 text-sm text-neutral-900">{cell(row.approved_amount)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Calculation date</p>
              <p className="mt-1 text-sm text-neutral-900">{cell(row.calculation_date)}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Assignment</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Contract</dt>
                <dd className="font-medium text-neutral-900">
                  {row.contract_id ? (
                    <Link href={`/contracts/${row.contract_id}`} className="hover:underline">
                      {row.contract_id}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-neutral-500">Gratuity rule</dt>
                <dd className="font-medium text-neutral-900">{cell(row.gratuity_rule_id)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Service period</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Service start</dt>
                <dd className="font-medium text-neutral-900">{cell(row.service_start_date)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Service end</dt>
                <dd className="font-medium text-neutral-900">{cell(row.service_end_date)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Basis amounts</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Salary basis</dt>
                <dd className="font-medium text-neutral-900">{cell(row.salary_basis_amount)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Allowance basis</dt>
                <dd className="font-medium text-neutral-900">{cell(row.allowance_basis_amount)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Total basis</dt>
                <dd className="font-medium text-neutral-900">{cell(row.total_basis_amount)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Override &amp; audit</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Override reason</dt>
                <dd className="whitespace-pre-wrap font-medium text-neutral-900">{cell(row.override_reason)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Created at</dt>
                <dd className="font-medium text-neutral-900">{cell(row.created_at)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Updated at</dt>
                <dd className="font-medium text-neutral-900">{cell(row.updated_at)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}
