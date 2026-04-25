import PageHeader from "@/components/layout/page-header";
import { getPhysicalFileMovementsReport } from "@/lib/queries/reports";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string { return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : ""; }
function display(value: string | null | undefined): string { return value && value.trim() ? value : "—"; }

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    query: firstString(sp.q),
    status: firstString(sp.status),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const rows = await getPhysicalFileMovementsReport(filters);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Physical files report"
        description="File movement, custody, and missing-file indicators for records management."
        backHref="/reports"
        actions={<ExportButtons />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/files" className="grid gap-3 md:grid-cols-4">
          <input name="q" defaultValue={filters.query} placeholder="Employee, file #, location" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <select name="status" defaultValue={filters.status} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"><option value="">All Statuses</option><option value="active">Active</option><option value="checked_out">Checked Out</option><option value="transferred">Transferred</option><option value="returned">Returned</option><option value="archived">Archived</option><option value="missing">Missing</option><option value="in_transit">In Transit</option></select>
          <input name="startDate" type="date" defaultValue={filters.startDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="endDate" type="date" defaultValue={filters.endDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Run Report</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!rows.length ? <p className="p-8 text-center text-sm text-neutral-600">No file movements match the selected filters.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">File #</th><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Holder</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Sent</th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((row) => <tr key={row.id} className="hover:bg-neutral-50"><td className="px-4 py-3 font-medium text-neutral-900">{display(row.employee_name ?? row.employee_number)}</td><td className="px-4 py-3">{display(row.file_number)}</td><td className="px-4 py-3">{display(row.from_location)}</td><td className="px-4 py-3">{display(row.to_location)}</td><td className="px-4 py-3">{display(row.current_holder)}</td><td className="px-4 py-3">{display(row.movement_status)}</td><td className="px-4 py-3">{display(row.date_sent)}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}

function ExportButtons() { return <div className="flex gap-2"><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export Excel</button><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export PDF</button></div>; }
