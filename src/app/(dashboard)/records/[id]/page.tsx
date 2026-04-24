import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecordById } from "@/lib/queries/records";

type RecordDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function show(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

export default async function RecordDetailPage({ params }: RecordDetailPageProps) {
  const { id } = await params;
  const record = await getRecordById(id);

  if (!record) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                {show(record.record_title)}
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                {show(record.record_type)} • {show(record.record_category)}
              </p>
            </div>
            <Link
              href={record.employee_id ? `/employees/${record.employee_id}` : "/records"}
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-200">
          <dl className="grid gap-4 md:grid-cols-2">
            <Detail label="Employee ID" value={record.employee_id} />
            <Detail label="Status" value={record.status} />
            <Detail label="Record Date" value={record.record_date} />
            <Detail label="Reference Number" value={record.reference_number} />
            <Detail label="Type" value={record.record_type} />
            <Detail label="Category" value={record.record_category} />
          </dl>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <TextBlock label="Description" value={record.description} />
            <TextBlock label="Notes" value={record.notes} />
          </div>
        </section>
      </div>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-neutral-900">{show(value)}</p>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 text-sm text-neutral-800 whitespace-pre-wrap">{show(value)}</p>
    </div>
  );
}
