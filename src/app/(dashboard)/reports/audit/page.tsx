import PageHeader from "@/components/layout/page-header";
import { getAuditReportData } from "@/lib/queries/reports";
import Link from "next/link";
import { formInputClass, formPrimaryButtonClass, formSecondaryButtonClass } from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };
function firstString(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : Array.isArray(value) ? (value[0] ?? "") : "";
}
function clean(value?: string | null): string {
  return value?.trim() ?? "";
}
function display(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

function toReadableLabel(value: string | null | undefined): string {
  const raw = clean(value);
  if (!raw) return "—";
  return raw
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function toReadableAction(value: string | null | undefined): string {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return "—";
  const direct: Record<string, string> = {
    create: "Create",
    update: "Update",
    delete: "Delete",
    approve: "Approve",
    reject: "Reject",
    acknowledge: "Acknowledge",
    resolve: "Resolve",
    login: "Login",
    logout: "Logout",
  };
  if (direct[normalized]) return direct[normalized];
  const suffix = normalized.split("_").pop() ?? normalized;
  return direct[suffix] ?? toReadableLabel(value);
}

function formatDate(value: string | null | undefined): string {
  const raw = clean(value);
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "—";
  const year = parsed.getFullYear();
  const month = parsed.toLocaleString(undefined, { month: "long" });
  const day = parsed.getDate();
  return `${year} ${month} ${day}`;
}

function formatTime(value: string | null | undefined): string {
  const raw = clean(value);
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function hasCriteria(filters: {
  show?: string;
  module?: string;
  action?: string;
  summary?: string;
  performedBy?: string;
  performedForEmployeeId?: string;
  startDate?: string;
  endDate?: string;
}): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.module) ||
      clean(filters.action) ||
      clean(filters.summary) ||
      clean(filters.performedBy) ||
      clean(filters.performedForEmployeeId) ||
      clean(filters.startDate) ||
      clean(filters.endDate)
  );
}

function buildSearchParams(filters: {
  show?: string;
  module?: string;
  action?: string;
  summary?: string;
  performedBy?: string;
  performedForEmployeeId?: string;
  startDate?: string;
  endDate?: string;
}): URLSearchParams {
  const params = new URLSearchParams();
  const entries: Array<[string, string | undefined]> = [
    ["show", filters.show],
    ["module", filters.module],
    ["action", filters.action],
    ["summary", filters.summary],
    ["performedByUserId", filters.performedBy],
    ["performedForEmployeeId", filters.performedForEmployeeId],
    ["startDate", filters.startDate],
    ["endDate", filters.endDate],
  ];
  for (const [key, value] of entries) {
    const trimmed = clean(value);
    if (trimmed) params.set(key, trimmed);
  }
  return params;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters = {
    show: firstString(sp.show),
    module: firstString(sp.module),
    action: firstString(sp.action),
    summary: firstString(sp.summary),
    performedBy: firstString(sp.performedByUserId) || firstString(sp.performedBy),
    performedForEmployeeId: firstString(sp.performedForEmployeeId),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
  };
  const reportData = await getAuditReportData(filters);
  const generated = reportData.generated;
  const rows = reportData.rows;
  const queryString = buildSearchParams(filters).toString();
  const excelHref = queryString ? `/api/reports/audit/excel?${queryString}` : "/api/reports/audit/excel";

  return (
    <main className="space-y-6">
      <PageHeader
        title="Audit report"
        description="Summaries of audit trail activity and changes across the system will appear here."
        backHref="/reports"
        actions={<ExportButtons generated={generated} excelHref={excelHref} />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/audit" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Module</span>
              <select
                name="module"
                defaultValue={filters.module}
                className={formInputClass}
              >
                <option value="">All</option>
                {reportData.moduleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Action</span>
              <select
                name="action"
                defaultValue={filters.action}
                className={formInputClass}
              >
                <option value="">All</option>
                {reportData.actionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            {reportData.includeSummaryFilter ? (
              <label className="space-y-1">
                <span className="text-sm font-medium text-neutral-700">Summary</span>
                <select
                  name="summary"
                  defaultValue={filters.summary}
                  className={formInputClass}
                >
                  <option value="">All</option>
                  {reportData.summaryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Performed By</span>
              <select
                name="performedBy"
                defaultValue={filters.performedBy}
                className={formInputClass}
              >
                <option value="">All</option>
                {reportData.performerOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Performed For</span>
              <select
                name="performedForEmployeeId"
                defaultValue={filters.performedForEmployeeId}
                className={formInputClass}
              >
                <option value="">All</option>
                {reportData.performedForOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Start Date</span>
              <input
                name="startDate"
                type="date"
                defaultValue={filters.startDate}
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">End Date</span>
              <input
                name="endDate"
                type="date"
                defaultValue={filters.endDate}
                className={formInputClass}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={formPrimaryButtonClass}>
              Apply Filters
            </button>
            <Link href="/reports/audit?show=all" className={formSecondaryButtonClass}>
              Show All
            </Link>
            {generated ? (
              <Link href="/reports/audit" className={formSecondaryButtonClass}>
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
          <p className="p-8 text-center text-sm text-neutral-600">
            No records found for the selected criteria.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Module</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Summary</th>
                  <th className="px-4 py-3">Performed By</th>
                  <th className="px-4 py-3">Performed For</th>
                  <th className="px-4 py-3">IP Address</th>
                  <th className="px-4 py-3">Computer / Device Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => (
                  <tr key={row.id} className="cursor-pointer hover:bg-neutral-50">
                    <td className="px-4 py-3">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {formatDate(row.event_timestamp ?? row.created_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {formatTime(row.event_timestamp ?? row.created_at)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {toReadableLabel(row.module_name)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {toReadableAction(row.action_type)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {display((row.action_summary ?? "").slice(0, 140) || null)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {display(row.performed_by_display_name)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {display(row.performed_for_display)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {display(row.ip_address)}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/reports/audit/${row.id}`} className="block w-full">
                        {display(row.device_name ?? row.computer_name ?? row.user_agent)}
                      </Link>
                    </td>
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
