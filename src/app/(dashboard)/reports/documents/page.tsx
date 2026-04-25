import PageHeader from "@/components/layout/page-header";
import { getDocumentExpiryReport } from "@/lib/queries/reports";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string { return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : ""; }
function display(value: string | null | undefined): string { return value && value.trim() ? value : "—"; }

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    query: firstString(sp.q),
    documentStatus: firstString(sp.documentStatus),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const rows = await getDocumentExpiryReport(filters);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Documents report"
        description="Document coverage, expiry risk, and compliance-oriented document metrics."
        backHref="/reports"
        actions={<ExportButtons />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/documents" className="grid gap-3 md:grid-cols-4">
          <input name="q" defaultValue={filters.query} placeholder="Employee, document, or file #" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="documentStatus" defaultValue={filters.documentStatus} placeholder="Document status" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="startDate" type="date" defaultValue={filters.startDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="endDate" type="date" defaultValue={filters.endDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Run Report</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!rows.length ? <p className="p-8 text-center text-sm text-neutral-600">No documents match the selected filters.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Document</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Expiry</th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((row) => <tr key={row.id} className="hover:bg-neutral-50"><td className="px-4 py-3">{display([row.employee_first_name, row.employee_last_name].filter(Boolean).join(" ") || row.employee_number)}</td><td className="px-4 py-3 font-medium text-neutral-900">{display(row.document_title)}</td><td className="px-4 py-3">{display(row.document_category)}</td><td className="px-4 py-3">{display(row.document_type)}</td><td className="px-4 py-3">{display(row.document_status)}</td><td className="px-4 py-3">{display(row.expiry_date)}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}

function ExportButtons() { return <div className="flex gap-2"><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export Excel</button><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export PDF</button></div>; }
