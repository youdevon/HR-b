import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  getLeaveReportData,
  type LeaveContractOption,
  type ReportFilters,
} from "@/lib/queries/reports";

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function firstString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

function clean(value?: string): string {
  return value?.trim() ?? "";
}

function display(value: string | number | null | undefined): string {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLeavePeriod(from: string | null | undefined, to: string | null | undefined): string {
  return `${formatDate(from)} to ${formatDate(to)}`;
}

function buildSearchParams(filters: ReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  const entries: Array<[keyof ReportFilters, string | undefined]> = [
    ["show", filters.show],
    ["query", filters.query],
    ["leaveType", filters.leaveType],
    ["status", filters.status],
    ["activeAsAtDate", filters.activeAsAtDate],
    ["effectiveFrom", filters.effectiveFrom],
    ["effectiveTo", filters.effectiveTo],
    ["contractYear", filters.contractYear],
    ["specificEmployeeLookup", filters.specificEmployeeLookup],
    ["specificEmployeeId", filters.specificEmployeeId],
    ["contractId", filters.contractId],
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
      clean(filters.leaveType) ||
      clean(filters.status) ||
      clean(filters.activeAsAtDate) ||
      clean(filters.effectiveFrom) ||
      clean(filters.effectiveTo) ||
      clean(filters.contractYear) ||
      clean(filters.specificEmployeeLookup) ||
      clean(filters.specificEmployeeId) ||
      clean(filters.contractId)
  );
}

function formatContractOptionLabel(contract: LeaveContractOption): string {
  const contractNumber = contract.contract_number ?? "N/A";
  const contractType =
    contract.contract_type === "fixed_term"
      ? "Fixed Term"
      : contract.contract_type === "temporary"
        ? "Short Term"
        : contract.contract_type ?? "N/A";
  const start = formatDate(contract.start_date);
  const end = formatDate(contract.end_date);
  return `${contractNumber} | ${contractType} | ${start} - ${end}`;
}

export default async function Page({ searchParams }: PageProps) {
  const sp = await searchParams;
  const filters: ReportFilters = {
    show: firstString(sp.show),
    query: firstString(sp.query) || firstString(sp.q),
    leaveType: firstString(sp.leaveType),
    status: firstString(sp.status),
    activeAsAtDate: firstString(sp.activeAsAtDate),
    effectiveFrom: firstString(sp.effectiveFrom) || firstString(sp.startDate),
    effectiveTo: firstString(sp.effectiveTo) || firstString(sp.endDate),
    contractYear: firstString(sp.contractYear),
    specificEmployeeLookup: firstString(sp.specificEmployeeLookup),
    specificEmployeeId: firstString(sp.specificEmployeeId),
    contractId: firstString(sp.contractId),
  };
  const generated = hasCriteria(filters);
  const reportData = await getLeaveReportData(filters);
  const rows = generated ? reportData.rows : [];
  const queryString = buildSearchParams(filters).toString();
  const excelHref = queryString ? `/api/reports/leave/excel?${queryString}` : "/api/reports/leave/excel";

  return (
    <main className="space-y-6">
      <PageHeader
        title="Leave report"
        description="Leave balances with effective period and contract-year filters."
        backHref="/reports"
        actions={<ExportButtons generated={generated} excelHref={excelHref} />}
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <form action="/reports/leave" className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-900">Leave Summary Report</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Employee Name or File Number</span>
              <input
                name="query"
                defaultValue={filters.query}
                placeholder="Search name or file #"
                className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Leave Type</span>
              <select
                name="leaveType"
                defaultValue={filters.leaveType}
                className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              >
                <option value="">All</option>
                <option value="vacation_leave">Vacation Leave</option>
                <option value="sick_leave">Sick Leave</option>
                <option value="casual_leave">Casual Leave</option>
                <option value="maternity_leave">Maternity Leave</option>
                <option value="paternity_leave">Paternity Leave</option>
                <option value="unpaid_leave">Unpaid Leave</option>
                <option value="special_leave">Special Leave</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Status</span>
              <select
                name="status"
                defaultValue={filters.status}
                className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Active As At Date</span>
              <input
                name="activeAsAtDate"
                type="date"
                defaultValue={filters.activeAsAtDate}
                className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Effective From</span>
              <input
                name="effectiveFrom"
                type="date"
                defaultValue={filters.effectiveFrom}
                className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Effective To</span>
              <input
                name="effectiveTo"
                type="date"
                defaultValue={filters.effectiveTo}
                className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-neutral-700">Contract Year</span>
              <input
                name="contractYear"
                type="number"
                min="1900"
                max="9999"
                defaultValue={filters.contractYear}
                placeholder="e.g. 2026"
                className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
              />
            </label>
          </div>
          <section className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <h3 className="text-sm font-semibold text-neutral-900">Specific Employee Contract</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1">
                <span className="text-sm font-medium text-neutral-700">Employee Name or File Number</span>
                <input
                  name="specificEmployeeLookup"
                  defaultValue={filters.specificEmployeeLookup}
                  placeholder="Search specific employee"
                  className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
                />
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-neutral-700">Employee</span>
                <select
                  name="specificEmployeeId"
                  defaultValue={filters.specificEmployeeId}
                  className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
                >
                  <option value="">Select employee</option>
                  {reportData.employeeOptions.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1">
                <span className="text-sm font-medium text-neutral-700">Contract</span>
                <select
                  name="contractId"
                  defaultValue={filters.contractId}
                  className="h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm text-neutral-900"
                >
                  <option value="">Select contract</option>
                  {reportData.contractOptions.map((contract) => (
                    <option key={contract.id} value={contract.id}>
                      {formatContractOptionLabel(contract)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>
          <p className="text-xs text-neutral-500">
            Use Active As At Date to view leave balances that applied on a specific date, regardless
            of each employee’s contract start date.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button className="inline-flex h-10 items-center rounded-xl bg-neutral-900 px-4 text-sm font-medium text-white">
              Apply Filters
            </button>
            <Link
              href="/reports/leave?show=all"
              className="inline-flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900"
            >
              Show All
            </Link>
            {generated ? (
              <Link
                href="/reports/leave"
                className="inline-flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900"
              >
                Clear
              </Link>
            ) : null}
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {!generated ? (
          <p className="p-8 text-center text-sm text-neutral-600">
            Use Show All or apply filters to generate the leave report.
          </p>
        ) : !rows.length ? (
          <p className="p-8 text-center text-sm text-neutral-600">No leave balances match the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-600">
              Each row represents a leave balance for a specific contract year and leave type. Employees may
              appear more than once when they have sick and vacation leave across multiple contract years.
            </div>
            <div className="border-b border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-500">
              Sick leave resets each contract year. Vacation leave is shown by contract-year period for
              planning and monitoring.
            </div>
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
                <tr>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">File #</th>
                  <th className="px-4 py-3">Contract Year</th>
                  <th className="px-4 py-3">Leave Period</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Entitlement</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {rows.map((row, index) => {
                  const employeeChanged = index > 0 && rows[index - 1]?.employee_name !== row.employee_name;
                  return (
                    <tr
                      key={row.id}
                      className={`${employeeChanged ? "border-t-2 border-neutral-200" : ""} hover:bg-neutral-50`}
                    >
                      <td className="px-4 py-3 font-medium text-neutral-900">{display(row.employee_name)}</td>
                      <td className="px-4 py-3">{display(row.file_number)}</td>
                      <td className="px-4 py-3">{row.contract_year_display}</td>
                      <td className="px-4 py-3">{formatLeavePeriod(row.effective_from, row.effective_to)}</td>
                      <td className="px-4 py-3">{display(row.leave_type_label)}</td>
                      <td className="px-4 py-3">{display(row.entitlement_days)}</td>
                      <td className="px-4 py-3">{display(row.used_days)}</td>
                      <td className="px-4 py-3">{display(row.remaining_days)}</td>
                      <td className="px-4 py-3">{row.status === "active" ? "Active" : "Inactive"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {reportData.selectedEmployee && reportData.selectedContract ? (
        <section className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-neutral-900">
            Specific Employee Contract Leave Detail
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Employee Name</p>
              <p className="text-sm font-medium text-neutral-900">{reportData.selectedEmployee.employee_name}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">File #</p>
              <p className="text-sm font-medium text-neutral-900">{display(reportData.selectedEmployee.file_number)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Department</p>
              <p className="text-sm font-medium text-neutral-900">{display(reportData.selectedEmployee.department)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Job Title</p>
              <p className="text-sm font-medium text-neutral-900">{display(reportData.selectedEmployee.job_title)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Contract Number</p>
              <p className="text-sm font-medium text-neutral-900">{display(reportData.selectedContract.contract_number)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Contract Type</p>
              <p className="text-sm font-medium text-neutral-900">
                {reportData.selectedContract.contract_type === "fixed_term"
                  ? "Fixed Term"
                  : reportData.selectedContract.contract_type === "temporary"
                    ? "Short Term"
                    : display(reportData.selectedContract.contract_type)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Start Date</p>
              <p className="text-sm font-medium text-neutral-900">{formatDate(reportData.selectedContract.start_date)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">End Date</p>
              <p className="text-sm font-medium text-neutral-900">{formatDate(reportData.selectedContract.end_date)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-xs text-neutral-500">Contract Status</p>
              <p className="text-sm font-medium text-neutral-900">{display(reportData.selectedContract.contract_status)}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
                <tr>
                  <th className="px-4 py-3">Contract Year</th>
                  <th className="px-4 py-3">Effective From</th>
                  <th className="px-4 py-3">Effective To</th>
                  <th className="px-4 py-3">Leave Type</th>
                  <th className="px-4 py-3">Entitlement</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Leave Taken Dates</th>
                  <th className="px-4 py-3">Number of Leave Transactions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {reportData.contractYearDetails.map((row, index) => (
                  <tr key={`${row.contract_year ?? "na"}-${row.leave_type}-${index}`}>
                    <td className="px-4 py-3">{display(row.contract_year)}</td>
                    <td className="px-4 py-3">{formatDate(row.effective_from)}</td>
                    <td className="px-4 py-3">{formatDate(row.effective_to)}</td>
                    <td className="px-4 py-3">{row.leave_type_label}</td>
                    <td className="px-4 py-3">{display(row.entitlement_days)}</td>
                    <td className="px-4 py-3">{display(row.used_days)}</td>
                    <td className="px-4 py-3">{display(row.remaining_days)}</td>
                    <td className="px-4 py-3">{row.leave_taken_dates}</td>
                    <td className="px-4 py-3">{row.transaction_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </main>
  );
}

function ExportButtons({ generated, excelHref }: { generated: boolean; excelHref: string }) {
  if (!generated) {
    return (
      <button
        type="button"
        disabled
        className="inline-flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-400"
      >
        Export Excel
      </button>
    );
  }
  return (
    <Link
      href={excelHref}
      className="inline-flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900"
    >
      Export Excel
    </Link>
  );
}
