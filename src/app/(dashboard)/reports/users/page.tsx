import PageHeader from "@/components/layout/page-header";
import { getUserAccountsReport } from "@/lib/queries/reports";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string { return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : ""; }
function display(value: string | boolean | null | undefined): string { if (typeof value === "boolean") return value ? "Yes" : "No"; return value && value.trim() ? value : "—"; }

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    query: firstString(sp.q),
    status: firstString(sp.status),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const rows = await getUserAccountsReport(filters);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Users report"
        description="Application users, roles, and access-related summaries for administrators."
        backHref="/reports"
        actions={<ExportButtons />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/users" className="grid gap-3 md:grid-cols-4">
          <input name="q" defaultValue={filters.query} placeholder="Name or email" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="status" defaultValue={filters.status} placeholder="Account status" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="startDate" type="date" defaultValue={filters.startDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="endDate" type="date" defaultValue={filters.endDate} className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">Run Report</button>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!rows.length ? <p className="p-8 text-center text-sm text-neutral-600">No user accounts match the selected filters.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600"><tr><th className="px-4 py-3">Full Name</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Account Status</th><th className="px-4 py-3">Created</th></tr></thead><tbody className="divide-y divide-neutral-100">{rows.map((row) => <tr key={row.id} className="hover:bg-neutral-50"><td className="px-4 py-3 font-medium text-neutral-900">{display([row.first_name, row.last_name].filter(Boolean).join(" "))}</td><td className="px-4 py-3">{display(row.email)}</td><td className="px-4 py-3">{display(row.role_name ?? row.role_code)}</td><td className="px-4 py-3">{display(row.account_status)}</td><td className="px-4 py-3">{display(row.created_at)}</td></tr>)}</tbody></table></div>
        )}
      </section>
    </main>
  );
}

function ExportButtons() { return <div className="flex gap-2"><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export Excel</button><button type="button" className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900">Export PDF</button></div>; }
