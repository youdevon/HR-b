import { listUsers } from "@/lib/queries/admin";
import { listRecentAuditLogs } from "@/lib/queries/audit";
import {
  calculateTotalMonthlyAllowances,
  listContractAllowancesByContractIds,
  listContracts,
  listContractsByEmployeeId,
  type ContractRecord,
} from "@/lib/queries/contracts";
import { listEmployees } from "@/lib/queries/employees";
import { listFileMovements } from "@/lib/queries/file-movements";
import { listLeaveBalances, listLeaveTransactions, type LeaveTransactionRecord } from "@/lib/queries/leave";
import { getEffectiveContractStatus } from "@/lib/queries/contracts";
import {
  calculateContractMonths,
  calculateGratuityPayment,
} from "@/lib/queries/gratuity";
import { createClient } from "@/lib/supabase/server";

export type ReportFilters = {
  query?: string;
  startDate?: string;
  endDate?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  activeAsAtDate?: string;
  contractYear?: string;
  specificEmployeeId?: string;
  specificEmployeeLookup?: string;
  contractId?: string;
  department?: string;
  status?: string;
  module?: string;
  action?: string;
  performedBy?: string;
  performedForEmployeeId?: string;
  summary?: string;
  roleId?: string;
  createdYear?: string;
  createdMonth?: string;
  show?: string;
  name?: string;
  fileNumber?: string;
  jobTitle?: string;
  contractStatus?: string;
  expiringRange?: string;
  contractType?: string;
  documentStatus?: string;
  leaveType?: string;
  reportType?: string;
  hasAllowances?: string;
  allowanceName?: string;
  fields?: string;
};

export type UserReportRow = {
  id: string;
  name: string;
  email: string | null;
  role_id: string | null;
  role_name: string | null;
  status: string;
  active: boolean | null;
  created_at: string | null;
  created_by_display: string;
  updated_at: string | null;
};

export type LeaveBalanceReportRow = {
  id: string;
  employee_id: string | null;
  employee_name: string;
  file_number: string | null;
  leave_period: string;
  leave_type: string | null;
  leave_type_label: string;
  entitlement_days: number | null;
  used_days: number | null;
  remaining_days: number | null;
  status: "active" | "inactive";
  effective_from: string | null;
  effective_to: string | null;
  balance_year: number | null;
  contract_year_display: string;
};

export type LeaveEmployeeOption = {
  id: string;
  label: string;
  employee_name: string;
  file_number: string | null;
  department: string | null;
  job_title: string | null;
};

export type LeaveContractOption = {
  id: string;
  contract_number: string | null;
  contract_type: string | null;
  start_date: string | null;
  end_date: string | null;
  contract_status: string | null;
};

export type LeaveContractYearDetailRow = {
  contract_year: number | null;
  effective_from: string | null;
  effective_to: string | null;
  leave_type: string;
  leave_type_label: string;
  entitlement_days: number | null;
  used_days: number | null;
  remaining_days: number | null;
  leave_taken_dates: string;
  transaction_count: number;
};

export type LeaveReportData = {
  generated: boolean;
  rows: LeaveBalanceReportRow[];
  employeeOptions: LeaveEmployeeOption[];
  contractOptions: LeaveContractOption[];
  selectedEmployee: LeaveEmployeeOption | null;
  selectedContract: LeaveContractOption | null;
  contractYearDetails: LeaveContractYearDetailRow[];
  contractTransactions: LeaveTransactionRecord[];
};

export type AuditFilterOption = {
  value: string;
  label: string;
};

export type AuditReportData = {
  generated: boolean;
  rows: Awaited<ReturnType<typeof listRecentAuditLogs>>;
  moduleOptions: AuditFilterOption[];
  actionOptions: AuditFilterOption[];
  performerOptions: AuditFilterOption[];
  performedForOptions: AuditFilterOption[];
  summaryOptions: AuditFilterOption[];
  includeSummaryFilter: boolean;
};

export type EmployeeReportFilters = {
  show?: string;
  name?: string;
  fileNumber?: string;
  department?: string;
  jobTitle?: string;
  status?: string;
  /** When true without hasContracts: only employees with no linked contracts. */
  noContracts?: string;
  /** When true without noContracts: only employees with at least one linked contract. */
  hasContracts?: string;
  fiscalCutoffYear?: string;
  fiscalCutoffMonth?: string;
  hasAllowances?: string;
  allowanceName?: string;
  fields?: string;
};

export const EMPLOYEE_REPORT_FIELD_OPTIONS = [
  { key: "file_number", label: "File #" },
  { key: "name", label: "Name" },
  { key: "department", label: "Department" },
  { key: "job_title", label: "Job Title" },
  { key: "start_date", label: "Contract Start Date" },
  { key: "end_date", label: "Contract End Date" },
  { key: "months", label: "Contract Period / Months" },
  { key: "monthly_salary", label: "Monthly Salary" },
  { key: "total_salary", label: "Total Contract Salary" },
  { key: "gratuity_eligible", label: "Gratuity Eligibility" },
  { key: "estimated_gratuity", label: "Estimated Gratuity" },
  { key: "allowance_names", label: "Allowance Names" },
  { key: "total_monthly_allowances", label: "Total Monthly Allowances" },
  { key: "monthly_salary_plus_allowances", label: "Monthly Salary + Allowances" },
  { key: "status", label: "Contract Status" },
] as const;

export type EmployeeReportFieldKey = (typeof EMPLOYEE_REPORT_FIELD_OPTIONS)[number]["key"];

export const EMPLOYEE_REPORT_DEFAULT_FIELDS: EmployeeReportFieldKey[] = [
  "file_number",
  "name",
  "department",
  "job_title",
  "start_date",
  "end_date",
  "monthly_salary",
  "status",
];

export type EmployeeReportRow = {
  employee_id: string;
  file_number: string | null;
  employee_name: string;
  department: string | null;
  job_title: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  contract_months: number | null;
  salary_amount: number | null;
  total_contract_salary: number | null;
  gratuity_eligible_display: string;
  estimated_gratuity_amount: number | null;
  estimated_gratuity_display: string;
  allowance_names: string;
  total_monthly_allowances: number | null;
  monthly_salary_plus_allowances: number | null;
  effective_contract_status: string | null;
};

export type ContractReportFieldKey =
  | "contract_number"
  | "employee_name"
  | "file_number"
  | "contract_type"
  | "contract_status"
  | "start_date"
  | "end_date"
  | "monthly_salary"
  | "gratuity_eligibility"
  | "estimated_gratuity"
  | "allowance_names"
  | "allowance_details"
  | "total_monthly_allowances"
  | "monthly_salary_plus_allowances";

export const CONTRACT_REPORT_FIELD_OPTIONS: Array<{ key: ContractReportFieldKey; label: string }> = [
  { key: "contract_number", label: "Contract Number" },
  { key: "employee_name", label: "Employee Name" },
  { key: "file_number", label: "File #" },
  { key: "contract_type", label: "Contract Type" },
  { key: "contract_status", label: "Contract Status / Effective Status" },
  { key: "start_date", label: "Start Date" },
  { key: "end_date", label: "End Date" },
  { key: "monthly_salary", label: "Monthly Salary" },
  { key: "gratuity_eligibility", label: "Gratuity Eligibility" },
  { key: "estimated_gratuity", label: "Estimated Gratuity" },
  { key: "allowance_names", label: "Allowance Names" },
  { key: "allowance_details", label: "Allowance Details" },
  { key: "total_monthly_allowances", label: "Total Monthly Allowances" },
  { key: "monthly_salary_plus_allowances", label: "Monthly Salary + Allowances" },
];

export const CONTRACT_REPORT_DEFAULT_FIELDS: ContractReportFieldKey[] = [
  "contract_number",
  "employee_name",
  "file_number",
  "contract_type",
  "contract_status",
  "start_date",
  "end_date",
  "monthly_salary",
  "allowance_names",
  "allowance_details",
  "total_monthly_allowances",
  "monthly_salary_plus_allowances",
  "gratuity_eligibility",
  "estimated_gratuity",
];

function clean(value?: string | null): string {
  return value?.trim() ?? "";
}

function isTruthyQueryFlag(value?: string): boolean {
  const normalized = clean(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "on";
}

/**
 * Contract availability:
 * - Only hasContracts: employees with at least one contract.
 * - Only noContracts: employees with no contracts.
 * - Both or neither: no restriction by contract presence.
 */
export function getContractAvailabilityMode(filters: EmployeeReportFilters): {
  restrictToHasContractsOnly: boolean;
  restrictToNoContractsOnly: boolean;
} {
  const has = isTruthyQueryFlag(filters.hasContracts);
  const no = isTruthyQueryFlag(filters.noContracts);
  return {
    restrictToHasContractsOnly: has && !no,
    restrictToNoContractsOnly: !has && no,
  };
}

/** Excel / UI filter summary line; null when no contract-availability filter applied. */
export function getContractAvailabilityFilterSummary(
  filters: EmployeeReportFilters
): string | null {
  const has = isTruthyQueryFlag(filters.hasContracts);
  const no = isTruthyQueryFlag(filters.noContracts);
  if (has && !no) return "Contract Availability: Employees with contracts";
  if (!has && no) return "Contract Availability: Employees with no contracts";
  if (has && no) return "Contract Availability: All";
  return null;
}

function matches(value: string | null | undefined, expected?: string): boolean {
  const normalizedExpected = clean(expected).toLowerCase();
  if (!normalizedExpected) return true;
  return (value ?? "").toLowerCase() === normalizedExpected;
}

function includes(value: string | null | undefined, query?: string): boolean {
  const normalizedQuery = clean(query).toLowerCase();
  if (!normalizedQuery) return true;
  return (value ?? "").toLowerCase().includes(normalizedQuery);
}

export function formatLeaveTypeLabel(value: string | null | undefined): string {
  const normalized = clean(value).toLowerCase();
  const labels: Record<string, string> = {
    vacation_leave: "Vacation Leave",
    sick_leave: "Sick Leave",
    casual_leave: "Casual Leave",
    maternity_leave: "Maternity Leave",
    paternity_leave: "Paternity Leave",
    unpaid_leave: "Unpaid Leave",
    special_leave: "Special Leave",
  };
  return labels[normalized] ?? (normalized ? normalized.replaceAll("_", " ") : "—");
}

function toReadableAuditLabel(value: string | null | undefined): string {
  const normalized = clean(value);
  if (!normalized) return "—";
  return normalized
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function toReadableAuditAction(value: string | null | undefined): string {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return "—";
  const map: Record<string, string> = {
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
  if (map[normalized]) return map[normalized];
  const suffix = normalized.split("_").pop() ?? normalized;
  return map[suffix] ?? toReadableAuditLabel(value);
}

function isBalanceActiveOnDate(
  effectiveFrom: string | null | undefined,
  effectiveTo: string | null | undefined,
  dateText: string
): boolean {
  const from = clean(effectiveFrom);
  const to = clean(effectiveTo);
  if (!from || !to) return false;
  return from <= dateText && to >= dateText;
}

function leaveDateRangeMatches(
  row: { effective_from: string | null; effective_to: string | null },
  from?: string,
  to?: string
): boolean {
  const filterFrom = clean(from);
  const filterTo = clean(to);
  const rowFrom = clean(row.effective_from);
  const rowTo = clean(row.effective_to);
  if (!filterFrom && !filterTo) return true;
  if (!rowFrom || !rowTo) return false;
  if (filterFrom && rowTo < filterFrom) return false;
  if (filterTo && rowFrom > filterTo) return false;
  return true;
}

function compareLeaveTypeLabel(a: string, b: string): number {
  return a.localeCompare(b);
}

function formatContractYearDisplay(input: { balanceYear: number | null; sequence: number }): string {
  if (input.sequence > 0) return `Year ${input.sequence}`;
  return input.balanceYear ? String(input.balanceYear) : "—";
}

function parseDate(value?: string | null): Date | null {
  const normalized = clean(value);
  if (!normalized) return null;
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function datesOverlap(
  aFrom?: string | null,
  aTo?: string | null,
  bFrom?: string | null,
  bTo?: string | null
): boolean {
  const af = parseDate(aFrom);
  const at = parseDate(aTo);
  const bf = parseDate(bFrom);
  const bt = parseDate(bTo);
  if (!af || !at || !bf || !bt) return false;
  return af <= bt && at >= bf;
}

function transactionInContractPeriod(
  row: LeaveTransactionRecord,
  contract: LeaveContractOption
): boolean {
  if (!contract.start_date || !contract.end_date) return false;
  const txFrom = row.start_date ?? row.created_at;
  const txTo = row.end_date ?? row.start_date ?? row.created_at;
  return datesOverlap(txFrom, txTo, contract.start_date, contract.end_date);
}

function summarizeTransactionDates(rows: LeaveTransactionRecord[]): string {
  const dates = rows
    .map((row) => {
      const start = clean(row.start_date);
      const end = clean(row.end_date);
      if (start && end) return start === end ? start : `${start} to ${end}`;
      return start || end || "";
    })
    .filter(Boolean);
  return dates.length ? dates.join("; ") : "—";
}

function inDateRange(value: string | null | undefined, filters: ReportFilters): boolean {
  if (!value) return !filters.startDate && !filters.endDate;
  const date = value.slice(0, 10);
  return (!filters.startDate || date >= filters.startDate) && (!filters.endDate || date <= filters.endDate);
}

function hasEmployeeReportCriteria(filters: EmployeeReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.name) ||
      clean(filters.fileNumber) ||
      clean(filters.department) ||
      clean(filters.jobTitle) ||
      clean(filters.status) ||
      clean(filters.noContracts) ||
      clean(filters.hasContracts) ||
      clean(filters.hasAllowances) ||
      clean(filters.allowanceName) ||
      clean(filters.fiscalCutoffYear) ||
      clean(filters.fiscalCutoffMonth)
  );
}

export function normalizeEmployeeReportFields(value?: string): EmployeeReportFieldKey[] {
  const allowed = new Set<EmployeeReportFieldKey>(
    EMPLOYEE_REPORT_FIELD_OPTIONS.map((option) => option.key)
  );
  if (typeof value === "undefined") return [...EMPLOYEE_REPORT_DEFAULT_FIELDS];
  const input = value.trim();
  if (!input) return [];
  const parsed = input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean) as EmployeeReportFieldKey[];
  const unique = [...new Set(parsed)].filter((entry) => allowed.has(entry));
  return unique.length ? unique : [...EMPLOYEE_REPORT_DEFAULT_FIELDS];
}

export function normalizeContractReportFields(value?: string): ContractReportFieldKey[] {
  const allowed = new Set<ContractReportFieldKey>(CONTRACT_REPORT_FIELD_OPTIONS.map((option) => option.key));
  if (typeof value === "undefined") return [...CONTRACT_REPORT_DEFAULT_FIELDS];
  const input = value.trim();
  if (!input) return [];
  const parsed = input
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean) as ContractReportFieldKey[];
  const unique = [...new Set(parsed)].filter((entry) => allowed.has(entry));
  return unique.length ? unique : [...CONTRACT_REPORT_DEFAULT_FIELDS];
}

function formatAllowanceSummary(allowances: Array<{ allowance_name: string; allowance_amount: number; allowance_frequency: string }>): string {
  if (!allowances.length) return "—";
  return allowances
    .map((allowance) => `${allowance.allowance_name}: $${Number(allowance.allowance_amount ?? 0).toFixed(2)} ${allowance.allowance_frequency}`)
    .join("; ");
}

export function calculateFiscalCutoffDate(
  fiscalCutoffYear?: string,
  fiscalCutoffMonth?: string
): string | null {
  const year = Number(clean(fiscalCutoffYear));
  const month = Number(clean(fiscalCutoffMonth));
  if (!Number.isInteger(year) || year < 1900) return null;
  if (!Number.isInteger(month) || month < 1 || month > 12) return null;
  const lastDay = new Date(year, month, 0).getDate();
  const mm = String(month).padStart(2, "0");
  const dd = String(lastDay).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

type EmployeeBaseRow = {
  id: string;
  file_number: string | null;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
  job_title: string | null;
};

type EmployeeContractRow = {
  id: string;
  employee_id: string | null;
  contract_status: string | null;
  start_date: string | null;
  end_date: string | null;
  salary_amount: number | null;
  is_gratuity_eligible: boolean | null;
  created_at: string | null;
};

function compareDateDesc(a?: string | null, b?: string | null): number {
  const at = a ? new Date(a).getTime() : 0;
  const bt = b ? new Date(b).getTime() : 0;
  return bt - at;
}

function pickRelevantContract(contracts: EmployeeContractRow[]): EmployeeContractRow | null {
  if (!contracts.length) return null;

  const active = contracts
    .filter(
      (contract) =>
        Boolean(contract.employee_id) &&
        getEffectiveContractStatus({
          contract_status: contract.contract_status,
          end_date: contract.end_date,
        }) === "active"
    )
    .sort((a, b) => compareDateDesc(a.start_date, b.start_date));
  if (active.length) return active[0] ?? null;

  const recent = [...contracts].sort((a, b) => {
    const byStart = compareDateDesc(a.start_date, b.start_date);
    if (byStart !== 0) return byStart;
    return compareDateDesc(a.created_at, b.created_at);
  });
  return recent[0] ?? null;
}

export async function getEmployeeReport(filters: EmployeeReportFilters): Promise<{
  generated: boolean;
  rows: EmployeeReportRow[];
  fiscalCutoffDate: string | null;
  missingFiscalCutoffMonth: boolean;
  selectedFields: EmployeeReportFieldKey[];
  estimatedGratuityExposure: number;
}> {
  const generated = hasEmployeeReportCriteria(filters);
  const selectedFields = normalizeEmployeeReportFields(filters.fields);
  const yearOnly = clean(filters.fiscalCutoffYear) && !clean(filters.fiscalCutoffMonth);
  const fiscalCutoffDate = calculateFiscalCutoffDate(
    filters.fiscalCutoffYear,
    filters.fiscalCutoffMonth
  );
  if (!generated) {
    return {
      generated: false,
      rows: [],
      fiscalCutoffDate: null,
      missingFiscalCutoffMonth: false,
      selectedFields,
      estimatedGratuityExposure: 0,
    };
  }

  const supabase = await createClient();
  const { data: employees, error: employeeError } = await supabase
    .from("employees")
    .select("id, file_number, first_name, last_name, department, job_title")
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });

  if (employeeError) {
    throw new Error(`Failed to load employees report data: ${employeeError.message}`);
  }

  const employeeRows = (employees ?? []) as EmployeeBaseRow[];
  const employeeIds = employeeRows.map((employee) => employee.id);
  let contractsByEmployeeId = new Map<string, EmployeeContractRow[]>();
  let allowancesByContractId = new Map<
    string,
    Array<{ allowance_name: string; allowance_amount: number; allowance_frequency: string; allowance_type: string | null }>
  >();
  if (employeeIds.length) {
    const { data: contracts, error: contractError } = await supabase
      .from("contracts")
      .select(
        "id, employee_id, contract_status, start_date, end_date, salary_amount, is_gratuity_eligible, created_at"
      )
      .in("employee_id", employeeIds);
    if (contractError) {
      throw new Error(`Failed to load contract data for employee report: ${contractError.message}`);
    }
    contractsByEmployeeId = (contracts ?? []).reduce((acc, row) => {
      const contract = row as EmployeeContractRow;
      if (!contract.employee_id) return acc;
      const list = acc.get(contract.employee_id) ?? [];
      list.push(contract);
      acc.set(contract.employee_id, list);
      return acc;
    }, new Map<string, EmployeeContractRow[]>());
    const contractIds = ((contracts ?? []) as EmployeeContractRow[]).map((row) => row.id);
    allowancesByContractId = await listContractAllowancesByContractIds(contractIds);
  }

  const normalizedName = clean(filters.name).toLowerCase();
  const normalizedFileNumber = clean(filters.fileNumber).toLowerCase();
  const normalizedDepartment = clean(filters.department).toLowerCase();
  const normalizedJobTitle = clean(filters.jobTitle).toLowerCase();
  const normalizedStatus = clean(filters.status).toLowerCase();
  const normalizedAllowanceName = clean(filters.allowanceName).toLowerCase();
  const hasAllowancesOnly = clean(filters.hasAllowances).toLowerCase() === "true";
  const { restrictToHasContractsOnly, restrictToNoContractsOnly } =
    getContractAvailabilityMode(filters);
  const ignoreContractBasedCutoffFilters = restrictToNoContractsOnly;

  const rows = employeeRows
    .map((employee) => {
      const selectedContract = pickRelevantContract(contractsByEmployeeId.get(employee.id) ?? []);
      const effectiveContractStatus = selectedContract
        ? getEffectiveContractStatus({
            contract_status: selectedContract.contract_status,
            end_date: selectedContract.end_date,
          })
        : null;
      const employeeName = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
      const contractMonths = selectedContract
        ? calculateContractMonths(selectedContract.start_date, selectedContract.end_date)
        : 0;
      const salaryAmount =
        typeof selectedContract?.salary_amount === "number" &&
        Number.isFinite(selectedContract.salary_amount)
          ? selectedContract.salary_amount
          : null;
      const totalContractSalary =
        salaryAmount !== null && contractMonths > 0
          ? Number((salaryAmount * contractMonths).toFixed(2))
          : null;
      const isEligible = selectedContract?.is_gratuity_eligible === true;
      const allowances = selectedContract ? allowancesByContractId.get(selectedContract.id) ?? [] : [];
      const totalMonthlyAllowances = allowances.length
        ? calculateTotalMonthlyAllowances(
            allowances.map((allowance) => ({
              allowance_amount: Number(allowance.allowance_amount ?? 0),
              allowance_frequency: allowance.allowance_frequency,
            }))
          )
        : 0;
      const allowanceNames = allowances.map((allowance) => allowance.allowance_name).filter(Boolean);
      const allowanceSummary = formatAllowanceSummary(
        allowances.map((allowance) => ({
          allowance_name: allowance.allowance_name,
          allowance_amount: Number(allowance.allowance_amount ?? 0),
          allowance_frequency: allowance.allowance_frequency,
        }))
      );

      let gratuityEligibleDisplay = "Not applicable";
      let estimatedGratuityAmount: number | null = null;
      let estimatedGratuityDisplay = "Not applicable";

      if (selectedContract) {
        gratuityEligibleDisplay = isEligible ? "Eligible" : "Not applicable";
        if (isEligible) {
          const hasDates = Boolean(selectedContract.start_date && selectedContract.end_date);
          if (!hasDates || salaryAmount === null) {
            estimatedGratuityDisplay = "Unable to calculate";
          } else {
            const breakdown = calculateGratuityPayment({
              monthlySalary: salaryAmount,
              contractMonths,
              isGratuityEligible: true,
            });
            estimatedGratuityAmount = breakdown.net_gratuity_payable;
            estimatedGratuityDisplay = String(breakdown.net_gratuity_payable);
          }
        }
      } else {
        gratuityEligibleDisplay = "—";
        estimatedGratuityDisplay = "—";
      }

      return {
        employee_id: employee.id,
        file_number: employee.file_number,
        employee_name: employeeName || "—",
        department: employee.department,
        job_title: employee.job_title,
        contract_start_date: selectedContract?.start_date ?? null,
        contract_end_date: selectedContract?.end_date ?? null,
        contract_months: selectedContract ? contractMonths : null,
        salary_amount: salaryAmount,
        total_contract_salary: totalContractSalary,
        gratuity_eligible_display: gratuityEligibleDisplay,
        estimated_gratuity_amount: estimatedGratuityAmount,
        estimated_gratuity_display: estimatedGratuityDisplay,
        allowance_names: allowanceSummary,
        total_monthly_allowances: allowances.length ? totalMonthlyAllowances : null,
        monthly_salary_plus_allowances:
          salaryAmount !== null ? Number((salaryAmount + totalMonthlyAllowances).toFixed(2)) : null,
        effective_contract_status: effectiveContractStatus,
      } satisfies EmployeeReportRow;
    })
    .filter((row) => {
      if (normalizedName && !row.employee_name.toLowerCase().includes(normalizedName)) return false;
      if (
        normalizedFileNumber &&
        !(row.file_number ?? "").toLowerCase().includes(normalizedFileNumber)
      ) {
        return false;
      }
      if (normalizedDepartment && (row.department ?? "").toLowerCase() !== normalizedDepartment) {
        return false;
      }
      if (normalizedJobTitle && (row.job_title ?? "").toLowerCase() !== normalizedJobTitle) {
        return false;
      }
      if (
        normalizedStatus &&
        !restrictToNoContractsOnly &&
        (row.effective_contract_status ?? "").toLowerCase() !== normalizedStatus
      ) {
        return false;
      }
      if (
        fiscalCutoffDate &&
        !ignoreContractBasedCutoffFilters &&
        row.contract_end_date &&
        row.contract_end_date > fiscalCutoffDate
      ) {
        return false;
      }
      if (restrictToNoContractsOnly && row.contract_start_date) {
        return false;
      }
      if (restrictToHasContractsOnly && !row.contract_start_date) {
        return false;
      }
      if (hasAllowancesOnly && Number(row.total_monthly_allowances ?? 0) <= 0) {
        return false;
      }
      if (normalizedAllowanceName && !row.allowance_names.toLowerCase().includes(normalizedAllowanceName)) {
        return false;
      }
      return true;
    });

  return {
    generated: true,
    rows,
    fiscalCutoffDate,
    missingFiscalCutoffMonth: Boolean(yearOnly),
    selectedFields,
    estimatedGratuityExposure: rows.reduce(
      (sum, row) => sum + Number(row.estimated_gratuity_amount ?? 0),
      0
    ),
  };
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function plusDaysDateString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function getEmployeeMasterListReport(filters: ReportFilters) {
  const rows = await listEmployees({ query: filters.query });
  return rows.filter(
    (row) =>
      matches(row.department, filters.department) &&
      matches(row.employment_status, filters.status) &&
      inDateRange(row.created_at, filters)
  );
}

export async function getContractsReport(filters: ReportFilters) {
  const rows = await listContracts({ query: filters.query });
  const allowancesByContractId = await listContractAllowancesByContractIds(rows.map((row) => row.id));
  const today = todayDateString();
  const normalizedStatus = clean(filters.contractStatus || filters.status).toLowerCase();
  const normalizedType = clean(filters.contractType).toLowerCase();
  const normalizedAllowanceName = clean(filters.allowanceName).toLowerCase();
  const hasAllowancesOnly = clean(filters.hasAllowances).toLowerCase() === "true";
  const expiringRange = Number(clean(filters.expiringRange));
  const expiringDays = expiringRange === 30 || expiringRange === 60 || expiringRange === 90 ? expiringRange : 30;
  const inRangeDays = plusDaysDateString(expiringDays);
  const reportType = clean(filters.reportType).toLowerCase();

  return rows
    .map((row) => {
      const allowances = allowancesByContractId.get(row.id) ?? [];
      const totalMonthlyAllowances = calculateTotalMonthlyAllowances(
        allowances.map((allowance) => ({
          allowance_amount: Number(allowance.allowance_amount ?? 0),
          allowance_frequency: allowance.allowance_frequency,
        }))
      );
      const allowanceNames = allowances.map((allowance) => allowance.allowance_name).filter(Boolean).join("; ");
      const allowanceDetails = formatAllowanceSummary(
        allowances.map((allowance) => ({
          allowance_name: allowance.allowance_name,
          allowance_amount: Number(allowance.allowance_amount ?? 0),
          allowance_frequency: allowance.allowance_frequency,
        }))
      );
      const monthlySalaryPlusAllowances =
        row.salary_amount !== null ? Number((Number(row.salary_amount) + totalMonthlyAllowances).toFixed(2)) : null;
      return {
        ...row,
        allowance_names: allowanceNames || "—",
        allowance_details: allowanceDetails,
        total_monthly_allowances: allowances.length ? totalMonthlyAllowances : null,
        monthly_salary_plus_allowances: monthlySalaryPlusAllowances,
        has_allowances: allowances.length > 0,
      };
    })
    .filter((row) => {
    const effectiveStatus = clean(row.effective_contract_status).toLowerCase();
    const contractType = clean(row.contract_type).toLowerCase();
    const statusMatch =
      !normalizedStatus ||
      normalizedStatus === "all" ||
      effectiveStatus === normalizedStatus;
    const contractTypeMatch =
      !normalizedType ||
      normalizedType === "both" ||
      contractType === normalizedType;
    const reportTypeMatch =
      !reportType ||
      (reportType === "active" && effectiveStatus === "active") ||
      (reportType === "expiring" &&
        effectiveStatus === "active" &&
        Boolean(row.end_date && row.end_date >= today && row.end_date <= inRangeDays)) ||
      (reportType === "expired" && effectiveStatus === "expired");
    const expiringRangeMatch =
      normalizedStatus !== "expiring" ||
      Boolean(row.end_date && row.end_date >= today && row.end_date <= inRangeDays);

    return (
      statusMatch &&
      contractTypeMatch &&
      reportTypeMatch &&
      expiringRangeMatch &&
      (!hasAllowancesOnly || row.has_allowances) &&
      (!normalizedAllowanceName || row.allowance_details.toLowerCase().includes(normalizedAllowanceName)) &&
      matches(row.department, filters.department) &&
      inDateRange(row.start_date ?? row.created_at, filters)
    );
  });
}

export async function getLeaveBalancesReport(filters: ReportFilters): Promise<LeaveBalanceReportRow[]> {
  const [balances, employees] = await Promise.all([listLeaveBalances(), listEmployees()]);
  const employeeById = new Map(
    employees.map((employee) => [
      employee.id,
      {
        file_number: employee.file_number ?? null,
        employee_name: `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "—",
      },
    ])
  );
  const activeAsAt = clean(filters.activeAsAtDate);
  const query = clean(filters.query).toLowerCase();
  const statusFilter = clean(filters.status).toLowerCase();
  const contractYear = Number(clean(filters.contractYear));

  const filteredRows = balances
    .map((row) => {
      const employee = row.employee_id ? employeeById.get(row.employee_id) : undefined;
      const status: "active" | "inactive" = isBalanceActiveOnDate(
        row.effective_from,
        row.effective_to,
        activeAsAt || todayDateString()
      )
        ? "active"
        : "inactive";
      return {
        id: row.id,
        employee_id: row.employee_id,
        employee_name: employee?.employee_name ?? "—",
        file_number: employee?.file_number ?? null,
        leave_period: `${clean(row.effective_from) || "—"} to ${clean(row.effective_to) || "—"}`,
        leave_type: row.leave_type,
        leave_type_label: formatLeaveTypeLabel(row.leave_type),
        entitlement_days: row.entitlement_days,
        used_days: row.used_days,
        remaining_days: row.remaining_days,
        status,
        effective_from: row.effective_from,
        effective_to: row.effective_to,
        balance_year: row.balance_year,
        contract_year_display: row.balance_year ? String(row.balance_year) : "—",
      } satisfies LeaveBalanceReportRow;
    })
    .filter((row) => {
      if (
        query &&
        !row.employee_name.toLowerCase().includes(query) &&
        !(row.file_number ?? "").toLowerCase().includes(query)
      ) {
        return false;
      }
      if (clean(filters.leaveType) && clean(row.leave_type).toLowerCase() !== clean(filters.leaveType).toLowerCase()) {
        return false;
      }
      if (statusFilter && statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }
      if (Number.isInteger(contractYear) && contractYear > 0 && row.balance_year !== contractYear) {
        return false;
      }
      if (activeAsAt) {
        return isBalanceActiveOnDate(row.effective_from, row.effective_to, activeAsAt);
      }
      return leaveDateRangeMatches(
        row,
        filters.effectiveFrom || filters.startDate,
        filters.effectiveTo || filters.endDate
      );
    });

  const sortedRows = [...filteredRows].sort((a, b) => {
    const byName = a.employee_name.localeCompare(b.employee_name);
    if (byName !== 0) return byName;
    const byStart = clean(a.effective_from).localeCompare(clean(b.effective_from));
    if (byStart !== 0) return byStart;
    return compareLeaveTypeLabel(a.leave_type_label, b.leave_type_label);
  });

  const yearlySequenceByEmployee = new Map<string, Map<string, number>>();
  for (const row of sortedRows) {
    const employeeKey = row.employee_id ?? row.employee_name;
    const periodKey = `${clean(row.effective_from)}|${clean(row.effective_to)}`;
    const perEmployee = yearlySequenceByEmployee.get(employeeKey) ?? new Map<string, number>();
    if (!perEmployee.has(periodKey)) {
      perEmployee.set(periodKey, perEmployee.size + 1);
      yearlySequenceByEmployee.set(employeeKey, perEmployee);
    }
    const sequence = perEmployee.get(periodKey) ?? 0;
    row.contract_year_display = formatContractYearDisplay({
      balanceYear: row.balance_year,
      sequence,
    });
  }

  return sortedRows;
}

function hasLeaveReportCriteria(filters: ReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.leaveType) ||
      clean(filters.status) ||
      clean(filters.activeAsAtDate) ||
      clean(filters.effectiveFrom) ||
      clean(filters.effectiveTo) ||
      clean(filters.contractYear) ||
      clean(filters.specificEmployeeId) ||
      clean(filters.contractId) ||
      clean(filters.specificEmployeeLookup)
  );
}

export async function getLeaveReportData(filters: ReportFilters): Promise<LeaveReportData> {
  const employees = await listEmployees();
  const employeeOptions = employees.map((employee) => {
    const employeeName = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "—";
    const file = employee.file_number ?? "—";
    return {
      id: employee.id,
      label: `${employeeName} (${file})`,
      employee_name: employeeName,
      file_number: employee.file_number ?? null,
      department: employee.department ?? null,
      job_title: employee.job_title ?? null,
    } satisfies LeaveEmployeeOption;
  });

  const lookup = clean(filters.specificEmployeeLookup).toLowerCase();
  const filteredEmployeeOptions = lookup
    ? employeeOptions.filter(
        (entry) =>
          entry.employee_name.toLowerCase().includes(lookup) ||
          (entry.file_number ?? "").toLowerCase().includes(lookup)
      )
    : employeeOptions;

  const selectedEmployeeId = clean(filters.specificEmployeeId);
  const selectedEmployee = selectedEmployeeId
    ? employeeOptions.find((entry) => entry.id === selectedEmployeeId) ?? null
    : null;

  const contractOptions = selectedEmployee
    ? (await listContractsByEmployeeId(selectedEmployee.id)).map((contract) => ({
        id: contract.id,
        contract_number: contract.contract_number,
        contract_type: contract.contract_type,
        start_date: contract.start_date,
        end_date: contract.end_date,
        contract_status: contract.contract_status,
      }))
    : [];
  const selectedContractId = clean(filters.contractId);
  const selectedContract =
    selectedContractId && contractOptions.length
      ? contractOptions.find((contract) => contract.id === selectedContractId) ?? null
      : null;

  const generated = hasLeaveReportCriteria(filters);
  if (!generated) {
    return {
      generated: false,
      rows: [],
      employeeOptions: filteredEmployeeOptions,
      contractOptions,
      selectedEmployee,
      selectedContract,
      contractYearDetails: [],
      contractTransactions: [],
    };
  }

  const rows = await getLeaveBalancesReport(filters);
  if (!selectedEmployee || !selectedContract) {
    return {
      generated: true,
      rows,
      employeeOptions: filteredEmployeeOptions,
      contractOptions,
      selectedEmployee,
      selectedContract,
      contractYearDetails: [],
      contractTransactions: [],
    };
  }

  const contractScopedRows = rows.filter(
    (row) =>
      row.employee_id === selectedEmployee.id &&
      datesOverlap(row.effective_from, row.effective_to, selectedContract.start_date, selectedContract.end_date)
  );
  const contractTransactions = (await listLeaveTransactions())
    .filter((row) => row.employee_id === selectedEmployee.id)
    .filter((row) => {
      const status = clean(row.approval_status ?? row.status).toLowerCase();
      return status === "approved" || status === "returned";
    })
    .filter((row) => transactionInContractPeriod(row, selectedContract));

  const contractYearDetails = contractScopedRows.map((row) => {
    const matchingTransactions = contractTransactions.filter((tx) => {
      const txLeaveType = clean(tx.leave_type).toLowerCase();
      return (
        txLeaveType === clean(row.leave_type).toLowerCase() &&
        datesOverlap(tx.start_date, tx.end_date, row.effective_from, row.effective_to)
      );
    });
    return {
      contract_year: row.balance_year,
      effective_from: row.effective_from,
      effective_to: row.effective_to,
      leave_type: row.leave_type ?? "",
      leave_type_label: row.leave_type_label,
      entitlement_days: row.entitlement_days,
      used_days: row.used_days,
      remaining_days: row.remaining_days,
      leave_taken_dates: summarizeTransactionDates(matchingTransactions),
      transaction_count: matchingTransactions.length,
    } satisfies LeaveContractYearDetailRow;
  });

  return {
    generated: true,
    rows,
    employeeOptions: filteredEmployeeOptions,
    contractOptions,
    selectedEmployee,
    selectedContract,
    contractYearDetails,
    contractTransactions,
  };
}

export async function getLeaveTransactionsReport(filters: ReportFilters) {
  const rows = await listLeaveTransactions({ query: filters.query });
  return rows.filter(
    (row) =>
      matches(row.leave_type, filters.leaveType) &&
      matches(row.approval_status, filters.status) &&
      inDateRange(row.start_date ?? row.created_at, filters)
  );
}

export async function getPhysicalFileMovementsReport(filters: ReportFilters) {
  const rows = await listFileMovements({ query: filters.query });
  return rows.filter(
    (row) =>
      matches(row.movement_status, filters.status) &&
      inDateRange(row.date_sent ?? row.created_at, filters)
  );
}

export async function getAuditActivityReport(filters: ReportFilters) {
  const generated = Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.module) ||
      clean(filters.action) ||
      clean(filters.performedBy) ||
      clean(filters.performedForEmployeeId) ||
      clean(filters.summary) ||
      clean(filters.startDate) ||
      clean(filters.endDate)
  );
  if (!generated) return [];

  const rows = await listRecentAuditLogs(250);
  const moduleFilter = clean(filters.module || filters.status).toLowerCase();
  const actionFilter = clean(filters.action).toLowerCase();
  const performedByFilter = clean(filters.performedBy).toLowerCase();
  const performedForFilter = clean(filters.performedForEmployeeId).toLowerCase();
  return rows.filter(
    (row) =>
      includes(row.action_summary, filters.query) &&
      (!moduleFilter || clean(row.module_name).toLowerCase() === moduleFilter) &&
      (!actionFilter || clean(row.action_type).toLowerCase() === actionFilter) &&
      (!performedByFilter || clean(row.performed_by_user_id).toLowerCase() === performedByFilter) &&
      (!performedForFilter || clean(row.related_employee_id).toLowerCase() === performedForFilter) &&
      (!clean(filters.summary) ||
        clean(row.action_summary).toLowerCase() === clean(filters.summary).toLowerCase()) &&
      inDateRange(row.event_timestamp ?? row.created_at, filters)
  );
}

export async function getAuditReportData(filters: ReportFilters): Promise<AuditReportData> {
  const supabase = await createClient();
  const [rows, profilesResult, employees] = await Promise.all([
    listRecentAuditLogs(300),
    supabase.from("user_profiles").select("id, first_name, last_name, email"),
    listEmployees(),
  ]);
  const generated = Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.module) ||
      clean(filters.action) ||
      clean(filters.performedBy) ||
      clean(filters.performedForEmployeeId) ||
      clean(filters.summary) ||
      clean(filters.startDate) ||
      clean(filters.endDate)
  );

  const moduleOptions = [
    ...new Map(
      rows
        .map((row) => clean(row.module_name))
        .filter(Boolean)
        .map((value) => [value.toLowerCase(), { value, label: toReadableAuditLabel(value) }])
    ).values(),
  ];
  const actionOptions = [
    ...new Map(
      rows
        .map((row) => clean(row.action_type))
        .filter(Boolean)
        .map((value) => [value.toLowerCase(), { value, label: toReadableAuditAction(value) }])
    ).values(),
  ];
  const performerOptions = (profilesResult.data ?? [])
    .map((profile) => {
      const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
      const label = name || profile.email || "System";
      return { value: profile.id, label } satisfies AuditFilterOption;
    })
    .filter((entry) => Boolean(entry.value))
    .sort((a, b) => a.label.localeCompare(b.label));
  const performedForOptions = employees
    .map((employee) => {
      const name = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown";
      return {
        value: employee.id,
        label: `${name} — File #${employee.file_number ?? "—"}`,
      } satisfies AuditFilterOption;
    })
    .sort((a, b) => a.label.localeCompare(b.label));
  const summaryOptions = [
    ...new Map(
      rows
        .map((row) => clean(row.action_summary))
        .filter(Boolean)
        .slice(0, 50)
        .map((value) => [value.toLowerCase(), { value, label: value }])
    ).values(),
  ];
  const includeSummaryFilter = summaryOptions.length > 0 && summaryOptions.length <= 50;

  if (!generated) {
    return {
      generated: false,
      rows: [],
      moduleOptions,
      actionOptions,
      performerOptions,
      performedForOptions,
      summaryOptions,
      includeSummaryFilter,
    };
  }

  const filteredRows = await getAuditActivityReport(filters);
  return {
    generated: true,
    rows: filteredRows,
    moduleOptions,
    actionOptions,
    performerOptions,
    performedForOptions,
    summaryOptions,
    includeSummaryFilter,
  };
}

export async function getUserAccountsReport(filters: ReportFilters) {
  const generated = Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.roleId) ||
      clean(filters.status) ||
      clean(filters.createdYear) ||
      clean(filters.createdMonth)
  );
  const missingCreatedYearForMonth =
    Boolean(clean(filters.createdMonth)) && !Boolean(clean(filters.createdYear));
  if (!generated) {
    return {
      generated: false,
      missingCreatedYearForMonth: false,
      rows: [] as UserReportRow[],
    };
  }

  const supabase = await createClient();
  const [hasIsActiveColumn, hasCreatedByColumn, hasUpdatedAtColumn] = await Promise.all([
    supabase.from("user_profiles").select("is_active").limit(1).then((r) => !r.error),
    supabase.from("user_profiles").select("created_by").limit(1).then((r) => !r.error),
    supabase.from("user_profiles").select("updated_at").limit(1).then((r) => !r.error),
  ]);
  const baseSelect = [
    "id",
    "first_name",
    "last_name",
    "email",
    "role_id",
    "account_status",
    "created_at",
    hasIsActiveColumn ? "is_active" : null,
    hasCreatedByColumn ? "created_by" : null,
    hasUpdatedAtColumn ? "updated_at" : null,
  ]
    .filter(Boolean)
    .join(", ");

  const { data, error } = await supabase
    .from("user_profiles")
    .select(baseSelect)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load users report: ${error.message}`);

  type UserProfileReportRow = {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    role_id: string | null;
    account_status: string | null;
    created_at: string | null;
    is_active?: boolean | null;
    created_by?: string | null;
    updated_at?: string | null;
  };

  const rows = (data ?? []) as unknown as UserProfileReportRow[];
  const roleIds = [...new Set(rows.map((row) => row.role_id).filter(Boolean))] as string[];
  const createdByIds = hasCreatedByColumn
    ? ([...new Set(rows.map((row) => row.created_by).filter(Boolean))] as string[])
    : [];
  const [{ data: roles }, { data: creators }] = await Promise.all([
    roleIds.length
      ? supabase.from("roles").select("id, role_name").in("id", roleIds)
      : Promise.resolve({ data: [] as Array<{ id: string; role_name: string | null }> }),
    createdByIds.length
      ? supabase
          .from("user_profiles")
          .select("id, first_name, last_name, email")
          .in("id", createdByIds)
      : Promise.resolve({
          data: [] as Array<{
            id: string;
            first_name: string | null;
            last_name: string | null;
            email: string | null;
          }>,
        }),
  ]);
  const roleNameById = new Map((roles ?? []).map((role) => [role.id, role.role_name ?? null]));
  const creatorById = new Map((creators ?? []).map((creator) => [creator.id, creator]));

  const normalizedQuery = clean(filters.query).toLowerCase();
  const normalizedStatus = clean(filters.status).toLowerCase();
  const normalizedRoleId = clean(filters.roleId);
  const yearFilter = Number(clean(filters.createdYear));
  const monthFilter = Number(clean(filters.createdMonth));

  const reportRows = rows
    .map((row) => {
      const creator = row.created_by ? creatorById.get(row.created_by) : undefined;
      const creatorName = creator
        ? `${creator.first_name ?? ""} ${creator.last_name ?? ""}`.trim()
        : "";
      const createdByDisplay = creatorName || creator?.email || "System";
      const statusText = clean(row.account_status).toLowerCase() || "inactive";
      const activeValue =
        hasIsActiveColumn && typeof row.is_active === "boolean"
          ? row.is_active
          : statusText === "active";
      const fullName = `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "—";
      return {
        id: row.id,
        name: fullName,
        email: row.email,
        role_id: row.role_id ?? null,
        role_name: row.role_id ? roleNameById.get(row.role_id) ?? null : null,
        status: statusText || "inactive",
        active: hasIsActiveColumn ? activeValue : statusText === "active",
        created_at: row.created_at,
        created_by_display: createdByDisplay || "—",
        updated_at: row.updated_at ?? null,
      } satisfies UserReportRow;
    })
    .filter((row) => {
      if (
        normalizedQuery &&
        !row.name.toLowerCase().includes(normalizedQuery) &&
        !(row.email ?? "").toLowerCase().includes(normalizedQuery)
      ) {
        return false;
      }
      if (normalizedRoleId && row.role_id !== normalizedRoleId) return false;
      if (normalizedStatus && normalizedStatus !== "all") {
        const isActive = row.active === true;
        const accountStatus = row.status;
        if (normalizedStatus === "active" && !(isActive && accountStatus === "active")) return false;
        if (
          normalizedStatus === "inactive" &&
          !(row.active === false || accountStatus === "inactive")
        ) {
          return false;
        }
        if (
          (normalizedStatus === "suspended" || normalizedStatus === "locked") &&
          accountStatus !== normalizedStatus
        ) {
          return false;
        }
      }
      if (yearFilter && Number.isInteger(yearFilter)) {
        const date = row.created_at ? new Date(row.created_at) : null;
        if (!date || Number.isNaN(date.getTime()) || date.getFullYear() !== yearFilter) return false;
      }
      if (monthFilter && Number.isInteger(monthFilter) && yearFilter && Number.isInteger(yearFilter)) {
        const date = row.created_at ? new Date(row.created_at) : null;
        if (!date || Number.isNaN(date.getTime()) || date.getMonth() + 1 !== monthFilter) return false;
      }
      return true;
    });

  return {
    generated: true,
    missingCreatedYearForMonth,
    rows: reportRows,
  };
}
