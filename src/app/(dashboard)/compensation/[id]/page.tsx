import Link from "next/link";
import { notFound } from "next/navigation";
import { getCompensationById } from "@/lib/queries/compensation";

type CompensationDetailPageProps = {
  params: Promise<{ id: string }>;
};

function cell(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default async function CompensationDetailPage({ params }: CompensationDetailPageProps) {
  const { id } = await params;
  const row = await getCompensationById(id);

  if (!row) {
    notFound();
  }

  const salary =
    row.salary_amount != null && row.salary_amount !== ""
      ? `${row.salary_amount}${row.currency ? ` ${row.currency}` : ""}`.trim()
      : "—";

  const allowance =
    row.allowance_amount != null && row.allowance_amount !== ""
      ? `${row.allowance_amount}${row.currency ? ` ${row.currency}` : ""}`.trim()
      : "—";

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Compensation</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Record <span className="font-mono text-xs text-neutral-500">{row.id}</span>
            </p>
            <p className="mt-2 text-sm font-medium text-neutral-800">{cell(row.compensation_status)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/compensation/current"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Current
            </Link>
            <Link
              href="/compensation/history"
              className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              History
            </Link>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Assignment</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Employee ID</dt>
                <dd className="font-medium text-neutral-900">{cell(row.employee_id)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Contract ID</dt>
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
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Pay</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Salary</dt>
                <dd className="font-medium text-neutral-900">{salary}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Salary frequency</dt>
                <dd className="font-medium text-neutral-900">{cell(row.salary_frequency)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Allowance</dt>
                <dd className="font-medium text-neutral-900">{allowance}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Allowance notes</dt>
                <dd className="whitespace-pre-wrap font-medium text-neutral-900">{cell(row.allowance_notes)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Currency</dt>
                <dd className="font-medium text-neutral-900">{cell(row.currency)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Schedule &amp; status</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Effective from</dt>
                <dd className="font-medium text-neutral-900">{cell(row.effective_from)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Effective to</dt>
                <dd className="font-medium text-neutral-900">{cell(row.effective_to)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Compensation status</dt>
                <dd className="font-medium text-neutral-900">{cell(row.compensation_status)}</dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Change &amp; notes</h2>
            <dl className="mt-4 space-y-4 text-sm">
              <div>
                <dt className="text-neutral-500">Change type</dt>
                <dd className="font-medium text-neutral-900">{cell(row.change_type)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Change reason</dt>
                <dd className="whitespace-pre-wrap font-medium text-neutral-900">{cell(row.change_reason)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Notes</dt>
                <dd className="whitespace-pre-wrap font-medium text-neutral-900">{cell(row.notes)}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Created at</dt>
                <dd className="font-medium text-neutral-900">{cell(row.created_at)}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </main>
  );
}
