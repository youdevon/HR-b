import PageHeader from "@/components/layout/page-header";
import { getUserAccountsReport } from "@/lib/queries/reports";
import { listRoles } from "@/lib/queries/admin";
import Link from "next/link";
import { formInputClass, formPrimaryButtonClass, formSecondaryButtonClass } from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : "";
}
function clean(value?: string | null): string {
  return value?.trim() ?? "";
}
function display(value: string | boolean | null | undefined): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return value && value.trim() ? value : "—";
}
function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function buildSearchParams(filters: {
  show?: string;
  query?: string;
  roleId?: string;
  status?: string;
  createdYear?: string;
  createdMonth?: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  const entries: Array<[string, string | undefined]> = [
    ["show", filters.show],
    ["query", filters.query],
    ["roleId", filters.roleId],
    ["status", filters.status],
    ["createdYear", filters.createdYear],
    ["createdMonth", filters.createdMonth],
  ];
  for (const [key, value] of entries) {
    const trimmed = clean(value);
    if (trimmed) params.set(key, trimmed);
  }
  return params;
}
function hasCriteria(filters: {
  show?: string;
  query?: string;
  roleId?: string;
  status?: string;
  createdYear?: string;
  createdMonth?: string;
}): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.roleId) ||
      clean(filters.status) ||
      clean(filters.createdYear) ||
      clean(filters.createdMonth)
  );
}

const MONTH_OPTIONS = [
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

export default async function Page({ searchParams }: PageProps) {
  await requirePermission("reports.users.view");
  const auth = await getDashboardSession();
  const canExport = hasAnyPermissionForContext(auth?.profile ?? null, auth?.permissions ?? [], ["reports.export"]);
  const sp = await searchParams;
  const filters = {
    show: firstString(sp.show),
    query: firstString(sp.query) || firstString(sp.q),
    roleId: firstString(sp.roleId),
    status: firstString(sp.status),
    createdYear: firstString(sp.createdYear),
    createdMonth: firstString(sp.createdMonth),
  };
  const roles = await listRoles();
  const { generated, rows, missingCreatedYearForMonth } = await getUserAccountsReport(filters);
  const queryString = buildSearchParams(filters).toString();
  const excelHref = queryString ? `/api/reports/users/excel?${queryString}` : "/api/reports/users/excel";

  return (
    <main className="space-y-6">
      <PageHeader
        title="Users report"
        description="Application users, roles, and access-related summaries for administrators."
        backHref="/reports"
        actions={<ExportButtons generated={generated && canExport} excelHref={excelHref} />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/users" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Search</span>
              <input
                name="query"
                defaultValue={filters.query}
                placeholder="Name or email"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Role</span>
              <select
                name="roleId"
                defaultValue={filters.roleId}
                className={formInputClass}
              >
                <option value="">All</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name ?? role.role_code ?? "—"}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Status</span>
              <select
                name="status"
                defaultValue={filters.status}
                className={formInputClass}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="locked">Locked</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Created Year</span>
              <input
                name="createdYear"
                type="number"
                min="1900"
                max="9999"
                defaultValue={filters.createdYear}
                placeholder="e.g. 2026"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Created Month</span>
              <select
                name="createdMonth"
                defaultValue={filters.createdMonth}
                className={formInputClass}
              >
                <option value="">All</option>
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={formPrimaryButtonClass}>
              Apply Filters
            </button>
            <Link href="/reports/users?show=all" className={formSecondaryButtonClass}>
              Show All
            </Link>
            {hasCriteria(filters) ? (
              <Link href="/reports/users" className={formSecondaryButtonClass}>
                Clear
              </Link>
            ) : null}
          </div>
          {missingCreatedYearForMonth ? (
            <p className="text-xs text-amber-700">Please select a year before selecting a month.</p>
          ) : null}
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!generated ? (
          <p className="p-8 text-center text-sm text-neutral-600">
            Use Show All or apply filters to generate this report.
          </p>
        ) : !rows.length ? (
          <p className="p-8 text-center text-sm text-neutral-600">
            No records found for the selected criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3">Created By</th>
                  <th className="px-4 py-3">Last Updated Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{display(row.name)}</td>
                    <td className="px-4 py-3">{display(row.email)}</td>
                    <td className="px-4 py-3">{display(row.role_name)}</td>
                    <td className="px-4 py-3">{display(row.status)}</td>
                    <td className="px-4 py-3">{display(row.active)}</td>
                    <td className="px-4 py-3">{formatDate(row.created_at)}</td>
                    <td className="px-4 py-3">{display(row.created_by_display)}</td>
                    <td className="px-4 py-3">{formatDate(row.updated_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function ExportButtons({ generated, excelHref }: { generated: boolean; excelHref: string }) {
  if (!generated) {
    return (
      <button
        type="button"
        disabled
        className={cn(formSecondaryButtonClass, "cursor-not-allowed text-neutral-400")}
      >
        Export Excel
      </button>
    );
  }
  return (
    <Link href={excelHref} className={formSecondaryButtonClass}>
      Export Excel
    </Link>
  );
}
