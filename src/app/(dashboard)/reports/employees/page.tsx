import PageHeader from "@/components/layout/page-header";
import { getEmployeeMasterListReport } from "@/lib/queries/reports";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

function display(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    query: firstString(sp.q),
    department: firstString(sp.department),
    status: firstString(sp.status),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const rows = await getEmployeeMasterListReport(filters);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Employee Master List"
        description="Headcount, department mix, and employment status summaries for HR planning."
        backHref="/reports"
        actions={<ExportButtons />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form className="grid gap-3 md:grid-cols-5" action="/reports/employees">
          <input name="q" defaultValue={filters.query} placeholder="Employee name or number" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="department" defaultValue={filters.department} placeholder="Department" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="status" defaultValue={filters.status} placeholder="Status" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="startDate" type="date" defaultValue={filters.startDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="endDate" type="date" defaultValue={filters.endDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white md:col-span-1">Run Report</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <Table rows={rows} />
      </section>
    </main>
  );
}

function ExportButtons() {
  return (
    <div className="flex gap-2">
      <button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export Excel</button>
      <button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export PDF</button>
    </div>
  );
}

function Table({ rows }: { rows: Awaited<ReturnType<typeof getEmployeeMasterListReport>> }) {
  if (!rows.length) {
    return <p className="p-8 text-center text-sm text-neutral-600">No employees match the selected filters.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
          <tr><th className="px-4 py-3">Employee #</th><th className="px-4 py-3">File #</th><th className="px-4 py-3">Name</th><th className="px-4 py-3">Department</th><th className="px-4 py-3">Job Title</th><th className="px-4 py-3">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.id} className="hover:bg-neutral-50">
              <td className="px-4 py-3">{display(row.employee_number)}</td>
              <td className="px-4 py-3">{display(row.file_number)}</td>
              <td className="px-4 py-3 font-medium text-neutral-900">{display([row.first_name, row.last_name].filter(Boolean).join(" "))}</td>
              <td className="px-4 py-3">{display(row.department)}</td>
              <td className="px-4 py-3">{display(row.job_title)}</td>
              <td className="px-4 py-3">{display(row.employment_status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
