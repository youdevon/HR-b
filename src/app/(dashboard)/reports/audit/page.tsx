import PageHeader from "@/components/layout/page-header";
import { getAuditActivityReport } from "@/lib/queries/reports";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string { return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : ""; }
function display(value: string | null | undefined): string { return value && value.trim() ? value : "—"; }

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    query: firstString(sp.q),
    status: firstString(sp.module),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const rows = await getAuditActivityReport(filters);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Audit report"
        description="Summaries of audit trail activity and changes across the system will appear here."
        backHref="/reports"
        actions={<ExportButtons />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/audit" className="grid gap-3 md:grid-cols-4">
          <input name="q" defaultValue={filters.query} placeholder="Action or summary" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="module" defaultValue={filters.status} placeholder="Module" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="startDate" type="date" defaultValue={filters.startDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="endDate" type="date" defaultValue={filters.endDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Run Report</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!rows.length ? <p className="p-8 text-center text-sm text-neutral-600">No audit activity matches the selected filters.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Module</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Summary</th><th className="px-4 py-3">Performed By</th><th className="px-4 py-3">Role</th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((row) => <tr key={row.id} className="hover:bg-neutral-50"><td className="px-4 py-3">{display(row.event_timestamp ?? row.created_at)}</td><td className="px-4 py-3">{display(row.module_name)}</td><td className="px-4 py-3">{display(row.action_type)}</td><td className="px-4 py-3 font-medium text-neutral-900">{display(row.action_summary)}</td><td className="px-4 py-3">{display(row.performed_by_name)}</td><td className="px-4 py-3">{display(row.role_at_time)}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}

function ExportButtons() { return <div className="flex gap-2"><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export Excel</button><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export PDF</button></div>; }
