import Link from "next/link";
import { notFound } from "next/navigation";
import { getDocumentById } from "@/lib/queries/documents";

type DocumentDetailPageProps = {
  params: Promise<{ id: string }>;
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm text-neutral-900">{value || "-"}</p>
    </div>
  );
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params;
  const doc = await getDocumentById(id);

  if (!doc) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{doc.document_title ?? "Document"}</h1>
              <p className="mt-1 text-sm text-neutral-600">{doc.document_type ?? "-"}</p>
            </div>
            <Link
              href="/documents"
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back to Documents
            </Link>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Document summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Item label="Category" value={doc.document_category ?? ""} />
            <Item label="Status" value={doc.document_status ?? ""} />
            <Item label="Employee ID" value={doc.employee_id ?? ""} />
            <Item label="Contract ID" value={doc.contract_id ?? ""} />
            <Item label="Leave transaction ID" value={doc.leave_transaction_id ?? ""} />
            <Item label="Gratuity calculation ID" value={doc.gratuity_calculation_id ?? ""} />
            <Item label="File movement ID" value={doc.file_movement_id ?? ""} />
            <Item label="File name" value={doc.file_name ?? ""} />
            <Item label="Visibility" value={doc.visibility_level ?? ""} />
            <Item label="Document date" value={doc.document_date ?? ""} />
            <Item label="Issued date" value={doc.issued_date ?? ""} />
            <Item label="Expiry date" value={doc.expiry_date ?? ""} />
            <div className="sm:col-span-2 lg:col-span-3">
              <Item label="Description" value={doc.document_description ?? ""} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Item label="Notes" value={doc.notes ?? ""} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
