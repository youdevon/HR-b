import PageHeader from "@/components/layout/page-header";
import Link from "next/link";
import {
  EMPLOYEE_REPORT_FIELD_OPTIONS,
  getContractAvailabilityMode,
  getEmployeeReport,
  type EmployeeReportFieldKey,
  type EmployeeReportFilters,
  type EmployeeReportRow,
} from "@/lib/queries/reports";
import {
  formCheckboxClass,
  formInputClass,
  formPrimaryButtonClass,
  formReadOnlyInputClass,
  formSecondaryButtonClass,
  formSelectClass,
} from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

function parseFieldsQuery(value: string | string[] | undefined): string | undefined {
  if (typeof value === "undefined") return undefined;
  if (typeof value === "string") return value;
  return value.join(",");
}

function display(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

function formatSalary(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function buildSearchParams(filters: EmployeeReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  const entries: Array<[keyof EmployeeReportFilters, string | undefined]> = [
    ["show", filters.show],
    ["name", filters.name],
    ["fileNumber", filters.fileNumber],
    ["department", filters.department],
    ["jobTitle", filters.jobTitle],
    ["status", filters.status],
    ["hasContracts", filters.hasContracts],
    ["noContracts", filters.noContracts],
    ["fiscalCutoffYear", filters.fiscalCutoffYear],
    ["fiscalCutoffMonth", filters.fiscalCutoffMonth],
    ["hasAllowances", filters.hasAllowances],
    ["allowanceName", filters.allowanceName],
    ["fields", filters.fields],
  ];
  for (const [key, value] of entries) {
    const trimmed = (value ?? "").trim();
    if (trimmed) params.set(key, trimmed);
  }
  return params;
}

function hasFiltersOrShow(filters: EmployeeReportFilters): boolean {
  return Boolean(
    (filters.show ?? "").trim().toLowerCase() === "all" ||
      (filters.name ?? "").trim() ||
      (filters.fileNumber ?? "").trim() ||
      (filters.department ?? "").trim() ||
      (filters.jobTitle ?? "").trim() ||
      (filters.status ?? "").trim() ||
      (filters.hasContracts ?? "").trim() ||
      (filters.noContracts ?? "").trim() ||
      (filters.hasAllowances ?? "").trim() ||
      (filters.allowanceName ?? "").trim() ||
      (filters.fiscalCutoffYear ?? "").trim() ||
      (filters.fiscalCutoffMonth ?? "").trim()
  );
}

function formatCutoffDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

const ALWAYS_VISIBLE_FIELDS: EmployeeReportFieldKey[] = ["file_number", "name"];

const FIELD_LABELS: Record<EmployeeReportFieldKey, string> = {
  file_number: "File #",
  name: "Name",
  department: "Department",
  job_title: "Job Title",
  start_date: "Contract Start Date",
  end_date: "Contract End Date",
  months: "Contract Period / Months",
  monthly_salary: "Monthly Salary",
  total_salary: "Total Contract Salary",
  gratuity_eligible: "Gratuity Eligibility",
  estimated_gratuity: "Estimated Gratuity",
  allowance_names: "Allowance Names",
  total_monthly_allowances: "Total Monthly Allowances",
  monthly_salary_plus_allowances: "Monthly Salary + Allowances",
  status: "Contract Status",
};

export default async function Page({ searchParams }: PageProps) {
  await requirePermission("reports.employees.view");
  const auth = await getDashboardSession();
  const canExport = hasAnyPermissionForContext(auth?.profile ?? null, auth?.permissions ?? [], ["reports.export"]);
  const sp = await searchParams;
  const filters: EmployeeReportFilters = {
    show: firstString(sp.show),
    name: firstString(sp.name),
    fileNumber: firstString(sp.fileNumber),
    department: firstString(sp.department),
    status: firstString(sp.status),
    jobTitle: firstString(sp.jobTitle),
    hasContracts: firstString(sp.hasContracts),
    noContracts: firstString(sp.noContracts),
    fiscalCutoffYear: firstString(sp.fiscalCutoffYear),
    fiscalCutoffMonth: firstString(sp.fiscalCutoffMonth),
    hasAllowances: firstString(sp.hasAllowances),
    allowanceName: firstString(sp.allowanceName),
    fields: parseFieldsQuery(sp.fields),
  };
  const {
    generated,
    rows,
    fiscalCutoffDate,
    missingFiscalCutoffMonth,
    selectedFields,
    estimatedGratuityExposure,
  } =
    await getEmployeeReport(filters);
  const hasCriteria = hasFiltersOrShow(filters);
  const { restrictToNoContractsOnly } = getContractAvailabilityMode(filters);
  const queryString = buildSearchParams(filters).toString();
  const excelHref = queryString
    ? `/api/reports/employees/excel?${queryString}`
    : "/api/reports/employees/excel";
  const contractsEndingByCutoff = fiscalCutoffDate
    ? rows.filter((row) => (row.contract_end_date ?? "") <= fiscalCutoffDate && row.contract_end_date)
        .length
    : 0;
  const salaryExposure = fiscalCutoffDate
    ? rows.reduce((sum, row) => sum + Number(row.total_contract_salary ?? 0), 0)
    : 0;
  const checkedFields = new Set(selectedFields);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Employee Report"
        description="Generate employee report rows using active/current contract details."
        backHref="/reports"
        actions={<ExportButtons generated={generated && canExport} excelHref={excelHref} />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" action="/reports/employees">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Name</span>
              <input
                name="name"
                defaultValue={filters.name}
                placeholder="Search employee name"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">File Number</span>
              <input
                name="fileNumber"
                defaultValue={filters.fileNumber}
                placeholder="Search file number"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Department</span>
              <input
                name="department"
                defaultValue={filters.department}
                placeholder="Department"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Job Title</span>
              <input
                name="jobTitle"
                defaultValue={filters.jobTitle}
                placeholder="Job title"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Status</span>
              <select
                name="status"
                defaultValue={filters.status}
                className={formInputClass}
              >
                <option value="">Any status</option>
                <option value="active">active</option>
                <option value="expired">expired</option>
                <option value="inactive">inactive</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Fiscal Year Cut-Off</span>
              <input
                type="number"
                name="fiscalCutoffYear"
                min="1900"
                max="9999"
                defaultValue={filters.fiscalCutoffYear}
                placeholder="Fiscal year (e.g. 2026)"
                className={formInputClass}
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Fiscal Year End Month</span>
              <select
                name="fiscalCutoffMonth"
                defaultValue={filters.fiscalCutoffMonth}
                className={formInputClass}
              >
                <option value="">Select month</option>
                {MONTH_OPTIONS.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            </label>
            <div className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Cut-Off Date Preview</span>
              <input
                type="text"
                readOnly
                value={formatCutoffDate(fiscalCutoffDate)}
                className={formReadOnlyInputClass}
              />
              <p className="text-xs text-neutral-500">
                Shows contracts ending on or before this fiscal cut-off date.
              </p>
            </div>
            <div className="space-y-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Contract Availability</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-3">
                  <input
                    type="checkbox"
                    name="hasContracts"
                    value="true"
                    defaultChecked={(filters.hasContracts ?? "").trim().toLowerCase() === "true"}
                    className={formCheckboxClass}
                  />
                  <span className="ml-2 text-sm text-neutral-900">Employees with contracts</span>
                </label>
                <label className="flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-3">
                  <input
                    type="checkbox"
                    name="noContracts"
                    value="true"
                    defaultChecked={(filters.noContracts ?? "").trim().toLowerCase() === "true"}
                    className={formCheckboxClass}
                  />
                  <span className="ml-2 text-sm text-neutral-900">Employees with no contracts</span>
                </label>
              </div>
              <p className="text-xs text-neutral-500">
                Leave both unchecked to include everyone. Check one to narrow the list. Check both to
                include everyone (no restriction).
              </p>
              {restrictToNoContractsOnly &&
              ((filters.fiscalCutoffYear ?? "").trim() ||
                (filters.fiscalCutoffMonth ?? "").trim() ||
                (filters.status ?? "").trim()) ? (
                <p className="text-xs text-neutral-600">
                  Fiscal cut-off, contract status, and other contract-based filters do not apply when
                  you only list employees without contracts.
                </p>
              ) : null}
            </div>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Has Allowances</span>
              <select name="hasAllowances" defaultValue={filters.hasAllowances} className={formSelectClass}>
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
            <p className="mt-1 text-xs text-neutral-500">
              Choose which report columns to display. File # and Name always stay visible.
            </p>
            <input type="hidden" name="fields" value="" />
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {EMPLOYEE_REPORT_FIELD_OPTIONS.filter(
                (option) => !ALWAYS_VISIBLE_FIELDS.includes(option.key)
              ).map((option) => (
                <label
                  key={option.key}
                  className="flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-3"
                >
                  <input
                    type="checkbox"
                    name="fields"
                    value={option.key}
                    defaultChecked={checkedFields.has(option.key)}
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
            <Link
              href="/reports/employees?show=all"
              className={formSecondaryButtonClass}
            >
              Show All
            </Link>
            {hasCriteria ? (
              <Link
                href="/reports/employees"
                className={formSecondaryButtonClass}
              >
                Clear
              </Link>
            ) : null}
          </div>
          <p className="text-xs text-neutral-500">
            Results appear only after Show All or at least one filter is applied.
          </p>
          {missingFiscalCutoffMonth ? (
            <p className="text-xs text-amber-700">
              Select a fiscal year end month to calculate the cut-off date.
            </p>
          ) : null}
          <div className="hidden">
            {(filters.show ?? "").trim() ? (
              <input type="hidden" name="show" value={filters.show} />
            ) : null}
          </div>
        </form>
      </section>

      {generated && fiscalCutoffDate ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-sm text-neutral-700">
            <span className="font-medium text-neutral-900">Fiscal Year Cut-Off:</span>{" "}
            {formatCutoffDate(fiscalCutoffDate)}
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Contracts ending by cut-off date</p>
              <p className="text-lg font-semibold text-neutral-900">{contractsEndingByCutoff}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Estimated salary exposure</p>
              <p className="text-lg font-semibold text-neutral-900">{formatSalary(salaryExposure)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Estimated gratuity exposure</p>
              <p className="text-lg font-semibold text-neutral-900">
                {formatSalary(estimatedGratuityExposure)}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {generated ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Selected Report Fields
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {[...new Set<EmployeeReportFieldKey>(["file_number", "name", ...selectedFields])].map(
              (field) => (
                <span
                  key={field}
                  className="inline-flex items-center rounded-full border border-neutral-300 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-700"
                >
                  {FIELD_LABELS[field]}
                </span>
              )
            )}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <Table generated={generated} rows={rows} selectedFields={selectedFields} />
      </section>
    </main>
  );
}

function ExportButtons({
  generated,
  excelHref,
}: {
  generated: boolean;
  excelHref: string;
}) {
  if (!generated) {
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled
          title="Generate a report before exporting."
          className={cn(
            formSecondaryButtonClass,
            "cursor-not-allowed border-neutral-200 bg-neutral-100 text-neutral-500"
          )}
        >
          Export Excel
        </button>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={excelHref} className={formSecondaryButtonClass}>
        Export Excel
      </Link>
    </div>
  );
}

function Table({
  generated,
  rows,
  selectedFields,
}: {
  generated: boolean;
  rows: EmployeeReportRow[];
  selectedFields: EmployeeReportFieldKey[];
}) {
  if (!generated) {
    return (
      <p className="p-8 text-center text-sm text-neutral-600">
        Use Show All or apply filters to generate this report.
      </p>
    );
  }

  if (!rows.length) {
    return (
      <p className="p-8 text-center text-sm text-neutral-600">
        No records found for the selected criteria.
      </p>
    );
  }

  const renderOrder: EmployeeReportFieldKey[] = [
    "file_number",
    "name",
    "department",
    "job_title",
    "start_date",
    "end_date",
    "months",
    "monthly_salary",
    "total_salary",
    "gratuity_eligible",
    "estimated_gratuity",
    "allowance_names",
    "total_monthly_allowances",
    "monthly_salary_plus_allowances",
    "status",
  ];
  const selected = new Set(selectedFields);
  selected.add("file_number");
  selected.add("name");
  const visibleFields = renderOrder.filter((field) => selected.has(field));
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
          <tr>
            {visibleFields.map((field) => (
              <th key={field} className="px-4 py-3">
                {FIELD_LABELS[field]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {rows.map((row) => (
            <tr key={row.employee_id} className="hover:bg-neutral-50">
              {visibleFields.map((field) => {
                if (field === "file_number") {
                  return <td key={field} className="px-4 py-3">{display(row.file_number)}</td>;
                }
                if (field === "name") {
                  return (
                    <td key={field} className="px-4 py-3 font-medium text-neutral-900">
                      {display(row.employee_name)}
                    </td>
                  );
                }
                if (field === "department") {
                  return <td key={field} className="px-4 py-3">{display(row.department)}</td>;
                }
                if (field === "job_title") {
                  return <td key={field} className="px-4 py-3">{display(row.job_title)}</td>;
                }
                if (field === "start_date") {
                  return <td key={field} className="px-4 py-3">{formatDate(row.contract_start_date)}</td>;
                }
                if (field === "end_date") {
                  return <td key={field} className="px-4 py-3">{formatDate(row.contract_end_date)}</td>;
                }
                if (field === "months") {
                  return (
                    <td key={field} className="px-4 py-3">
                      {row.contract_months === null ? "—" : String(row.contract_months)}
                    </td>
                  );
                }
                if (field === "monthly_salary") {
                  return <td key={field} className="px-4 py-3">{formatSalary(row.salary_amount)}</td>;
                }
                if (field === "total_salary") {
                  return <td key={field} className="px-4 py-3">{formatSalary(row.total_contract_salary)}</td>;
                }
                if (field === "gratuity_eligible") {
                  return (
                    <td key={field} className="px-4 py-3">
                      {display(row.gratuity_eligible_display)}
                    </td>
                  );
                }
                if (field === "estimated_gratuity") {
                  return (
                    <td key={field} className="px-4 py-3">
                      {row.estimated_gratuity_amount !== null
                        ? formatSalary(row.estimated_gratuity_amount)
                        : row.estimated_gratuity_display}
                    </td>
                  );
                }
                if (field === "allowance_names") {
                  return (
                    <td key={field} className="px-4 py-3">
                      {display(row.allowance_names)}
                    </td>
                  );
                }
                if (field === "total_monthly_allowances") {
                  return (
                    <td key={field} className="px-4 py-3">
                      {row.total_monthly_allowances !== null
                        ? formatSalary(row.total_monthly_allowances)
                        : "—"}
                    </td>
                  );
                }
                if (field === "monthly_salary_plus_allowances") {
                  return (
                    <td key={field} className="px-4 py-3">
                      {row.monthly_salary_plus_allowances !== null
                        ? formatSalary(row.monthly_salary_plus_allowances)
                        : "—"}
                    </td>
                  );
                }
                return (
                  <td key={field} className="px-4 py-3">
                    {display(row.effective_contract_status)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
