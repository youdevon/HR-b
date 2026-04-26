import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { calculateContractMonths, calculateGratuityPayment } from "@/lib/queries/gratuity";
import {
  CONTRACT_REPORT_DEFAULT_FIELDS,
  CONTRACT_REPORT_FIELD_OPTIONS,
  getContractsReport,
  normalizeContractReportFields,
  type ContractReportFieldKey,
  type ReportFilters,
} from "@/lib/queries/reports";
import {
  formCheckboxClass,
  formInputClass,
  formPrimaryButtonClass,
  formSecondaryButtonClass,
} from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function firstString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

function parseFieldsQuery(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(",");
  return "";
}

function clean(value?: string): string {
  return value?.trim() ?? "";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
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

function formatContractType(value: string | null): string {
  if (value === "fixed_term") return "Fixed Term";
  if (value === "temporary") return "Short Term";
  return value ? value.replaceAll("_", " ") : "—";
}

function formatStatus(value: string | null): string {
  if (!value) return "—";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function buildSearchParams(filters: ReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  const entries: Array<[keyof ReportFilters, string | undefined]> = [
    ["show", filters.show],
    ["query", filters.query],
    ["contractStatus", filters.contractStatus],
    ["expiringRange", filters.expiringRange],
    ["contractType", filters.contractType],
    ["department", filters.department],
    ["startDate", filters.startDate],
    ["endDate", filters.endDate],
    ["reportType", filters.reportType],
    ["hasAllowances", filters.hasAllowances],
    ["allowanceName", filters.allowanceName],
    ["fields", filters.fields],
  ];
  for (const [key, value] of entries) {
    const trimmed = clean(value);
    if (trimmed) params.set(key, trimmed);
  }
  return params;
}

function hasCriteria(filters: ReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.contractStatus) ||
      clean(filters.expiringRange) ||
      clean(filters.contractType) ||
      clean(filters.department) ||
      clean(filters.startDate) ||
      clean(filters.endDate) ||
      clean(filters.reportType) ||
      clean(filters.hasAllowances) ||
      clean(filters.allowanceName)
  );
}

export default async function Page({ searchParams }: PageProps) {
  await requirePermission("reports.contracts.view");
  const auth = await getDashboardSession();
  const canExport = hasAnyPermissionForContext(auth?.profile ?? null, auth?.permissions ?? [], ["reports.export"]);
  const sp = await searchParams;
  const filters: ReportFilters = {
    show: firstString(sp.show),
    query: firstString(sp.q) || firstString(sp.query),
    reportType: firstString(sp.reportType),
    contractStatus: firstString(sp.contractStatus),
    expiringRange: firstString(sp.expiringRange),
    contractType: firstString(sp.contractType),
    department: firstString(sp.department),
    startDate: firstString(sp.startDate),
    endDate: firstString(sp.endDate),
    hasAllowances: firstString(sp.hasAllowances),
    allowanceName: firstString(sp.allowanceName),
    fields: parseFieldsQuery(sp.fields),
  };

  const shouldGenerate = hasCriteria(filters);
  const rows = shouldGenerate ? await getContractsReport(filters) : [];
  const selectedFields = normalizeContractReportFields(filters.fields);

  const queryString = buildSearchParams(filters).toString();
  const excelHref = queryString
    ? `/api/reports/contracts/excel?${queryString}`
    : "/api/reports/contracts/excel";

  return (
    <main className="space-y-6">
      <PageHeader
        title="Contracts report"
        description="Filter contracts by status, term type, and expiry window."
        backHref="/reports"
        actions={<ExportButtons generated={shouldGenerate && canExport} excelHref={excelHref} />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/contracts" className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Contract Status</span>
              <select
                name="contractStatus"
                defaultValue={filters.contractStatus}
                className={formInputClass}
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Expiring Range</span>
              <select
                name="expiringRange"
                defaultValue={filters.expiringRange}
                className={formInputClass}
              >
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Contract Type</span>
              <select
                name="contractType"
                defaultValue={filters.contractType}
                className={formInputClass}
              >
                <option value="">Both</option>
                <option value="fixed_term">Fixed Term</option>
                <option value="temporary">Short Term</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Search</span>
              <input
                name="query"
                defaultValue={filters.query}
                placeholder="Contract #, employee, file #"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Has Allowances</span>
              <select
                name="hasAllowances"
                defaultValue={filters.hasAllowances}
                className={formInputClass}
              >
                <option value="">All</option>
                <option value="true">With allowances</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Allowance Type / Name</span>
              <input
                name="allowanceName"
                defaultValue={filters.allowanceName}
                placeholder="Housing, Travelling, etc."
                className={formInputClass}
              />
            </label>
          </div>

          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-medium text-neutral-700">Report Fields</h3>
            <p className="mt-1 text-xs text-neutral-500">Choose which columns to include in the report table and export.</p>
            <input type="hidden" name="fields" value="" />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {CONTRACT_REPORT_FIELD_OPTIONS.map((option) => (
                <label
                  key={option.key}
                  className="flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-3 text-sm"
                >
                  <input
                    type="checkbox"
                    name="fields"
                    value={option.key}
                    defaultChecked={selectedFields.includes(option.key)}
                    className={formCheckboxClass}
                  />
                  <span className="ml-2 text-sm text-neutral-900">{option.label}</span>
                </label>
              ))}
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={formPrimaryButtonClass}>
              Apply Filters
            </button>
            <Link href="/reports/contracts?show=all" className={formSecondaryButtonClass}>
              Show All
            </Link>
            {shouldGenerate ? (
              <Link href="/reports/contracts" className={formSecondaryButtonClass}>
                Clear
              </Link>
            ) : null}
          </div>
          <p className="text-xs text-neutral-500">
            Expiring range applies when Contract Status is set to Expiring.
          </p>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!shouldGenerate ? (
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
                  {(selectedFields.length ? selectedFields : CONTRACT_REPORT_DEFAULT_FIELDS).map((field) => (
                    <th key={field} className="px-4 py-3">
                      {CONTRACT_REPORT_FIELD_OPTIONS.find((option) => option.key === field)?.label ?? field}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row) => {
                  const months = calculateContractMonths(row.start_date, row.end_date);
                  const estimated =
                    row.is_gratuity_eligible && row.salary_amount !== null && months > 0
                      ? calculateGratuityPayment({
                          monthlySalary: row.salary_amount,
                          contractMonths: months,
                          isGratuityEligible: true,
                        }).net_gratuity_payable
                      : null;
                  return (
                    <tr key={row.id} className="hover:bg-neutral-50">
                      {(selectedFields.length ? selectedFields : CONTRACT_REPORT_DEFAULT_FIELDS).map((field) => {
                        if (field === "contract_number") return <td key={field} className="px-4 py-3 font-medium text-neutral-900">{row.contract_number ?? "—"}</td>;
                        if (field === "employee_name") return <td key={field} className="px-4 py-3">{row.employee_name ?? "—"}</td>;
                        if (field === "file_number") return <td key={field} className="px-4 py-3">{row.employee_number ?? "—"}</td>;
                        if (field === "contract_type") return <td key={field} className="px-4 py-3">{formatContractType(row.contract_type)}</td>;
                        if (field === "contract_status") return <td key={field} className="px-4 py-3">{formatStatus(row.contract_status)} / {formatStatus(row.effective_contract_status)}</td>;
                        if (field === "start_date") return <td key={field} className="px-4 py-3">{formatDate(row.start_date)}</td>;
                        if (field === "end_date") return <td key={field} className="px-4 py-3">{formatDate(row.end_date)}</td>;
                        if (field === "monthly_salary") return <td key={field} className="px-4 py-3">{formatCurrency(row.salary_amount)}</td>;
                        if (field === "gratuity_eligibility") return <td key={field} className="px-4 py-3">{row.is_gratuity_eligible ? "Eligible" : "Not applicable"}</td>;
                        if (field === "estimated_gratuity") return <td key={field} className="px-4 py-3">{formatCurrency(estimated)}</td>;
                        if (field === "allowance_names") return <td key={field} className="px-4 py-3 whitespace-normal break-words">{row.allowance_names ?? "—"}</td>;
                        if (field === "allowance_details") return <td key={field} className="px-4 py-3 whitespace-normal break-words">{row.allowance_details ?? "—"}</td>;
                        if (field === "total_monthly_allowances") return <td key={field} className="px-4 py-3">{formatCurrency(row.total_monthly_allowances ?? null)}</td>;
                        return <td key={field} className="px-4 py-3">{formatCurrency(row.monthly_salary_plus_allowances ?? null)}</td>;
                      })}
                    </tr>
                  );
                })}
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
