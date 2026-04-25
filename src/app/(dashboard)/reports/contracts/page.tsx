import PageHeader from "@/components/layout/page-header";
import { getContractsReport } from "@/lib/queries/reports";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string { return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : ""; }
function display(value: string | number | null | undefined): string { return value === null || value === undefined || value === "" ? "—" : String(value); }

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    query: firstString(sp.q),
    reportType: firstString(sp.reportType),
    contractStatus: firstString(sp.contractStatus),
    department: firstString(sp.department),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const rows = await getContractsReport(filters);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Contracts report"
        description="Contract volume, status, and renewal-related metrics for leadership review."
        backHref="/reports"
        actions={<ExportButtons />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/contracts" className="grid gap-3 md:grid-cols-6">
          <input name="q" defaultValue={filters.query} placeholder="Employee or contract" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <select name="reportType" defaultValue={filters.reportType} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"><option value="">All Types</option><option value="active">Active</option><option value="expiring">Expiring</option><option value="expired">Expired</option></select>
          <input name="contractStatus" defaultValue={filters.contractStatus} placeholder="Contract status" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="department" defaultValue={filters.department} placeholder="Department" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="startDate" type="date" defaultValue={filters.startDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="endDate" type="date" defaultValue={filters.endDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Run Report</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!rows.length ? <p className="p-8 text-center text-sm text-neutral-600">No contracts match the selected filters.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Contract</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Start</th><th className="px-4 py-3">End</th><th className="px-4 py-3">Department</th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((row) => <tr key={row.id} className="hover:bg-neutral-50"><td className="px-4 py-3">{display(row.employee_name ?? row.employee_id)}</td><td className="px-4 py-3 font-medium text-neutral-900">{display(row.contract_title ?? row.contract_number)}</td><td className="px-4 py-3">{display(row.contract_type)}</td><td className="px-4 py-3">{display(row.contract_status)}</td><td className="px-4 py-3">{display(row.start_date)}</td><td className="px-4 py-3">{display(row.end_date)}</td><td className="px-4 py-3">{display(row.department)}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}

function ExportButtons() { return <div className="flex gap-2"><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export Excel</button><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export PDF</button></div>; }
