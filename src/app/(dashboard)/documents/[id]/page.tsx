import Link from "next/link";

type DocumentDetailPageProps = { params: { id: string } };

const mockById: Record<string, { [key: string]: string }> = {
  doc_1: {
    document_title: "Standard Employment Contract 2026",
    document_category: "Contract",
    document_type: "Employment Agreement",
    employee_id: "emp_001",
    contract_id: "ctr_1",
    file_name: "employment-contract-2026.pdf",
    document_status: "Active",
    document_date: "2026-01-01",
    issued_date: "2025-12-20",
    expiry_date: "2027-12-31",
    visibility_level: "HR_ONLY",
    document_description: "Signed contract for annual term.",
    notes: "Original copy in records room.",
  },
};

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm text-neutral-900">{value || "-"}</p>
    </div>
  );
}

export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const doc = mockById[params.id] ?? {
    document_title: "Document not found in placeholder dataset",
    document_category: "-",
    document_type: "-",
    employee_id: "-",
    contract_id: "-",
    file_name: "-",
    document_status: "-",
    document_date: "-",
    issued_date: "-",
    expiry_date: "-",
    visibility_level: "-",
    document_description: "-",
    notes: "-",
  };

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{doc.document_title}</h1>
              <p className="mt-1 text-sm text-neutral-600">{doc.document_type}</p>
            </div>
            <Link href="/documents" className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50">
              Back to Documents
            </Link>
          </div>
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Document Summary</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Item label="Category" value={doc.document_category} />
            <Item label="Status" value={doc.document_status} />
            <Item label="Employee ID" value={doc.employee_id} />
            <Item label="Contract ID" value={doc.contract_id} />
            <Item label="File Name" value={doc.file_name} />
            <Item label="Visibility" value={doc.visibility_level} />
            <Item label="Document Date" value={doc.document_date} />
            <Item label="Issued Date" value={doc.issued_date} />
            <Item label="Expiry Date" value={doc.expiry_date} />
            <div className="sm:col-span-2 lg:col-span-3"><Item label="Description" value={doc.document_description} /></div>
            <div className="sm:col-span-2 lg:col-span-3"><Item label="Notes" value={doc.notes} /></div>
          </div>
        </section>
      </div>
    </main>
  );
}
