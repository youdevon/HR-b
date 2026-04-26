import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { getPhysicalFileMovementsReport, type ReportFilters } from "@/lib/queries/reports";
import {
  formInputClass,
  formPrimaryButtonClass,
  formSecondaryButtonClass,
} from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string { return typeof value === "string" ? value : Array.isArray(value) ? value[0] ?? "" : ""; }
function display(value: string | null | undefined): string { return value && value.trim() ? value : "—"; }
function clean(value?: string): string { return value?.trim() ?? ""; }

function hasCriteria(filters: ReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.status) ||
      clean(filters.startDate) ||
      clean(filters.endDate)
  );
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
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters: ReportFilters = {
    show: firstString(sp.show),
    query: firstString(sp.query) || firstString(sp.q),
    status: firstString(sp.status),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const generated = hasCriteria(filters);
  const rows = generated ? await getPhysicalFileMovementsReport(filters) : [];
  const queryString = buildSearchParams(filters).toString();
  const excelHref = queryString ? `/api/reports/files/excel?${queryString}` : "/api/reports/files/excel";

  return (
    <main className="space-y-6">
      <PageHeader
        title="Physical files report"
        description="File movement, custody, and missing-file indicators for records management."
        backHref="/reports"
        actions={<ExportButtons generated={generated} excelHref={excelHref} />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/files" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Search</span>
              <input
                name="query"
                defaultValue={filters.query}
                placeholder="Employee, file #, location"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Status</span>
              <select name="status" defaultValue={filters.status} className={formInputClass}>
                <option value="">All statuses</option>
                <option value="active">Active</option>
                <option value="checked_out">Checked out</option>
                <option value="transferred">Transferred</option>
                <option value="returned">Returned</option>
                <option value="archived">Archived</option>
                <option value="missing">Missing</option>
                <option value="in_transit">In transit</option>
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
            <Link href="/reports/files?show=all" className={formSecondaryButtonClass}>
              Show All
            </Link>
            {generated ? (
              <Link href="/reports/files" className={formSecondaryButtonClass}>
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
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Holder</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{display(row.employee_name ?? row.employee_number)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{display(row.file_number)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{display(row.from_location)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{display(row.to_location)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{display(row.current_holder)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{display(row.movement_status)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{formatDate(row.date_sent)}</td>
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
