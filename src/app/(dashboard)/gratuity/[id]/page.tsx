import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { getGratuityCalculationById } from "@/lib/queries/gratuity";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const record = await getGratuityCalculationById(id);

  if (!record) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Gratuity calculation"
        description={`Review basis amounts, service period, and approval status for this calculation. ${id}`}
        backHref="/gratuity/calculations"
        actions={
        <Link
          href="/gratuity/calculations"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          All calculations
        </Link>
        }
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-neutral-500">Status</dt>
            <dd className="mt-1 font-medium text-neutral-900">{record.calculation_status ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Employee</dt>
            <dd className="mt-1 font-medium text-neutral-900">{record.employee_id ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Calculated amount</dt>
            <dd className="mt-1 font-medium text-neutral-900">
              {record.calculated_amount != null ? String(record.calculated_amount) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Reviewed amount</dt>
            <dd className="mt-1 font-medium text-neutral-900">
              {record.reviewed_amount != null ? String(record.reviewed_amount) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Approved amount</dt>
            <dd className="mt-1 font-medium text-neutral-900">
              {record.approved_amount != null ? String(record.approved_amount) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-neutral-500">Calculation date</dt>
            <dd className="mt-1 font-medium text-neutral-900">{record.calculation_date ?? "—"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
