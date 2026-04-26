import PageHeader from "@/components/layout/page-header";
import Link from "next/link";
import { getGratuityReportData, type ReportFilters } from "@/lib/queries/reports";
import { formInputClass, formPrimaryButtonClass, formSecondaryButtonClass } from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function firstString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

function clean(value?: string): string {
  return value?.trim() ?? "";
}

function buildSearchParams(filters: ReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  const entries: Array<[keyof ReportFilters, string | undefined]> = [
    ["show", filters.show],
    ["query", filters.query],
    ["status", filters.status],
    ["startDate", filters.startDate],
    ["endDate", filters.endDate],
  ];
  for (const [key, value] of entries) {
    const trimmed = clean(value);
    if (trimmed) params.set(key, trimmed);
  }
  return params;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function formatCurrency(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatStatus(value: string): string {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");
}
export default async function Page({ searchParams }: PageProps) {
  await requirePermission("reports.gratuity.view");
  const auth = await getDashboardSession();
  const canExport = hasAnyPermissionForContext(auth?.profile ?? null, auth?.permissions ?? [], ["reports.export"]);
  const sp = await searchParams;
  const filters: ReportFilters = {
    show: firstString(sp.show),
    query: firstString(sp.query) || firstString(sp.q),
    status: firstString(sp.status),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const { generated, rows } = await getGratuityReportData(filters);
  const queryString = buildSearchParams(filters).toString();
  const excelHref = queryString ? `/api/reports/gratuity/excel?${queryString}` : "/api/reports/gratuity/excel";

  return (
    <main className="space-y-6">
      <PageHeader
        title="Gratuity report"
        description="Gratuity calculations, approvals, and payment readiness for finance and HR."
        backHref="/reports"
        actions={<ExportButtons generated={generated && canExport} excelHref={excelHref} />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/gratuity" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Search</span>
              <input
                name="query"
                defaultValue={filters.query}
                placeholder="Employee, file #, contract #"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Status</span>
              <select name="status" defaultValue={filters.status} className={formInputClass}>
                <option value="">All statuses</option>
                <option value="calculated">Calculated</option>
                <option value="under_review">Under review</option>
                <option value="approved">Approved</option>
                <option value="overridden">Overridden</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Start Date</span>
              <input name="startDate" type="date" defaultValue={filters.startDate} className={formInputClass} />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">End Date</span>
              <input name="endDate" type="date" defaultValue={filters.endDate} className={formInputClass} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={formPrimaryButtonClass}>
              Apply Filters
            </button>
            <Link href="/reports/gratuity?show=all" className={formSecondaryButtonClass}>
              Show All
            </Link>
            {generated ? (
              <Link href="/reports/gratuity" className={formSecondaryButtonClass}>
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!generated ? (
          <p className="p-8 text-center text-sm text-neutral-600">
            Use Show All or apply filters to generate this report.
          </p>
        ) : !rows.length ? (
          <p className="p-8 text-center text-sm text-neutral-600">No records found for the selected criteria.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">File #</th>
                  <th className="px-4 py-3">Contract #</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Calculation Date</th>
                  <th className="px-4 py-3">Approved Date</th>
                  <th className="px-4 py-3">Service Period</th>
                  <th className="px-4 py-3">Service Months</th>
                  <th className="px-4 py-3">Salary Basis</th>
                  <th className="px-4 py-3">Approved Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{row.employee_name}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{row.file_number ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{row.contract_number ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{formatStatus(row.calculation_status)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{formatDate(row.calculation_date)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{formatDate(row.approved_at)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {formatDate(row.service_start_date)} to {formatDate(row.service_end_date)}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{row.service_length_months ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{formatCurrency(row.salary_basis_amount)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{formatCurrency(row.approved_amount)}</td>
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
        className={cn(formSecondaryButtonClass, "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-500")}
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
