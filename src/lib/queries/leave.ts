import { createClient } from "@/lib/supabase/server";

export const LEAVE_TYPES = [
  "vacation_leave",
  "sick_leave",
  "casual_leave",
  "maternity_leave",
  "paternity_leave",
  "unpaid_leave",
  "special_leave",
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "cancelled",
  "returned",
] as const;

export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export type LeaveAction =
  | "apply_leave"
  | "approve_leave"
  | "reject_leave"
  | "cancel_leave"
  | "return_from_leave";

export type LeaveBalanceRecord = {
  id: string;
  employee_id: string | null;
  contract_id?: string | null;
  leave_type: string | null;
  entitlement_days: number | null;
  used_days: number | null;
  remaining_days: number | null;
  carried_forward_days: number | null;
  adjusted_days: number | null;
  pending_days: number | null;
  balance_year: number | null;
  effective_from: string | null;
  effective_to: string | null;
  warning_threshold_days: number | null;
  low_balance_warning_enabled: boolean | null;
  exhausted_warning_enabled: boolean | null;
  created_at: string | null;
};

export type LeaveTransactionRecord = {
  id: string;
  employee_id: string | null;
  leave_balance_id: string | null;
  employee_name: string | null;
  employee_first_name: string | null;
  employee_last_name: string | null;
  employee_number: string | null;
  leave_type: string | null;
  transaction_type: string | null;
  start_date: string | null;
  end_date: string | null;
  days: number | null;
  total_days: number | null;
  entitlement_days: number | null;
  days_taken: number | null;
  balance_days: number | null;
  reason: string | null;
  status: string | null;
  approval_status: string | null;
  approved_by: string | null;
  approval_date: string | null;
  rejection_reason: string | null;
  notes: string | null;
  medical_certificate_required: boolean | null;
  medical_certificate_received: boolean | null;
  return_to_work_date: string | null;
  created_at: string | null;
};

type LeaveTransactionRow = {
  id: string;
  employee_id: string | null;
  leave_balance_id: string | null;
  leave_type: string | null;
  transaction_type: string | null;
  start_date: string | null;
  end_date: string | null;
  days: number | null;
  reason: string | null;
  status: string | null;
  notes: string | null;
  medical_certificate_required: boolean | null;
  medical_certificate_received: boolean | null;
  return_to_work_date: string | null;
  created_at: string | null;
};

type ContractCoverageRow = {
  id: string;
  employee_id: string | null;
  contract_status: string | null;
  start_date: string | null;
  end_date: string | null;
};

type EmployeeNameRow = {
  id: string;
  employee_number: string | null;
  first_name: string | null;
  last_name: string | null;
};

const LEAVE_BALANCE_SELECT = `
  id,
  employee_id,
  leave_type,
  entitlement_days,
  used_days,
  remaining_days,
  carried_forward_days,
  adjusted_days,
  pending_days,
  balance_year,
  effective_from,
  effective_to,
  warning_threshold_days,
  low_balance_warning_enabled,
  exhausted_warning_enabled,
  created_at
`;

export type ContractLeaveEntitlementInput = {
  employee_id: string;
  contract_id: string;
  contract_start_date: string;
  contract_end_date: string | null;
  vacation_leave_days: number;
  sick_leave_days: number;
};

export type LeaveBalanceLike = Pick<
  LeaveBalanceRecord,
  | "leave_type"
  | "entitlement_days"
  | "used_days"
  | "remaining_days"
  | "effective_from"
  | "effective_to"
>;

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function rangesOverlap(
  startA: string | null | undefined,
  endA: string | null | undefined,
  startB: string | null | undefined,
  endB: string | null | undefined
): boolean {
  if (!startB || !endB) return true;
  const aStart = parseDateOnly(startA);
  const aEnd = parseDateOnly(endA);
  const bStart = parseDateOnly(startB);
  const bEnd = parseDateOnly(endB);
  if (!aStart || !aEnd || !bStart || !bEnd) return false;
  return aStart <= bEnd && aEnd >= bStart;
}

export function summarizeVacationLeaveWithinPeriod(
  balances: LeaveBalanceLike[],
  periodStart: string | null | undefined,
  periodEnd: string | null | undefined
): { entitlement: number; used: number; remaining: number } {
  const relevant = balances.filter(
    (balance) =>
      normalizeLeaveType(balance.leave_type ?? "") === "vacation_leave" &&
      rangesOverlap(balance.effective_from, balance.effective_to, periodStart, periodEnd)
  );

  return relevant.reduce(
    (acc, balance) => ({
      entitlement: acc.entitlement + Number(balance.entitlement_days ?? 0),
      used: acc.used + Number(balance.used_days ?? 0),
      remaining: acc.remaining + Number(balance.remaining_days ?? 0),
    }),
    { entitlement: 0, used: 0, remaining: 0 }
  );
}

export function getCurrentSickLeaveBalance(
  balances: LeaveBalanceLike[],
  todayDateText: string,
  periodStart: string | null | undefined,
  periodEnd: string | null | undefined
): LeaveBalanceLike | null {
  const sickBalances = balances.filter(
    (balance) =>
      normalizeLeaveType(balance.leave_type ?? "") === "sick_leave" &&
      rangesOverlap(balance.effective_from, balance.effective_to, periodStart, periodEnd)
  );

  const inCurrentWindow = sickBalances.find((balance) => {
    const start = balance.effective_from ?? "";
    const end = balance.effective_to ?? "";
    return start <= todayDateText && todayDateText <= end;
  });
  if (inCurrentWindow) return inCurrentWindow;

  return sickBalances.sort((a, b) =>
    String(b.effective_from ?? "").localeCompare(String(a.effective_from ?? ""))
  )[0] ?? null;
}

function normalizeNonNegativeNumber(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Leave entitlement days must be greater than or equal to 0.");
  }
  return Number(value.toFixed(2));
}

function parseIsoDateOnly(dateText: string): Date | null {
  const [yearText, monthText, dayText] = dateText.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function formatIsoDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addYears(date: Date, years: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function buildContractYearPeriods(
  startDateText: string,
  endDateText: string
): Array<{
  balance_year: number;
  effective_from: string;
  effective_to: string;
}> {
  const startDate = parseIsoDateOnly(startDateText);
  const endDate = parseIsoDateOnly(endDateText);
  if (!startDate || !endDate) {
    throw new Error("Contract dates must be valid ISO dates.");
  }
  if (endDate.getTime() < startDate.getTime()) {
    throw new Error("Contract end date must be after or equal to start date.");
  }

  const periods: Array<{
    balance_year: number;
    effective_from: string;
    effective_to: string;
  }> = [];
  let cursor = new Date(startDate);

  while (cursor.getTime() <= endDate.getTime()) {
    const nextYearStart = addYears(cursor, 1);
    const periodEndCandidate = addDays(nextYearStart, -1);
    const effectiveTo =
      periodEndCandidate.getTime() <= endDate.getTime() ? periodEndCandidate : endDate;
    periods.push({
      balance_year: cursor.getFullYear(),
      effective_from: formatIsoDateOnly(cursor),
      effective_to: formatIsoDateOnly(effectiveTo),
    });
    cursor = addDays(effectiveTo, 1);
  }

  return periods;
}

function extractYearsFromPeriods(
  periods: Array<{ balance_year: number }>
): number[] {
  return [...new Set(periods.map((period) => period.balance_year))];
}

async function hasLeaveBalanceContractIdColumn(): Promise<boolean> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("leave_balances")
    .select("contract_id")
    .limit(1);
  return !error;
}

export async function upsertContractLeaveEntitlements(
  input: ContractLeaveEntitlementInput
): Promise<void> {
  const employeeId = input.employee_id.trim();
  const contractId = input.contract_id.trim();
  const startDate = input.contract_start_date.trim();
  const endDate = (input.contract_end_date ?? "").trim();
  if (!employeeId || !contractId) {
    throw new Error("Employee and contract are required for leave entitlement sync.");
  }
  if (!startDate) {
    throw new Error("Contract start date is required to create leave balances.");
  }
  if (!endDate) {
    throw new Error("Contract end date is required to create leave balances.");
  }

  const entitlementByType: Array<{ leave_type: LeaveType; entitlement_days: number }> = [
    {
      leave_type: "vacation_leave",
      entitlement_days: normalizeNonNegativeNumber(input.vacation_leave_days),
    },
    {
      leave_type: "sick_leave",
      entitlement_days: normalizeNonNegativeNumber(input.sick_leave_days),
    },
  ];

  const supportsContractId = await hasLeaveBalanceContractIdColumn();
  const supabase = await createClient();
  const periods = buildContractYearPeriods(startDate, endDate);
  const periodYears = extractYearsFromPeriods(periods);
  const periodByYear = new Map(periods.map((period) => [period.balance_year, period]));

  const existingByTypeAndYear = new Map<string, { id: string }>();

  let existingQuery = supabase
    .from("leave_balances")
    .select("id, leave_type, balance_year")
    .eq("employee_id", employeeId)
    .in("leave_type", ["vacation_leave", "sick_leave"])
    .in("balance_year", periodYears);
  if (supportsContractId) {
    existingQuery = existingQuery.eq("contract_id", contractId);
  }
  const { data: existingRows, error: existingRowsError } = await existingQuery;
  if (existingRowsError) {
    throw new Error(
      `Failed to load existing contract leave balances: ${existingRowsError.message}`
    );
  }
  for (const row of existingRows ?? []) {
    const leaveType = String(row.leave_type ?? "");
    const balanceYear = Number(row.balance_year ?? 0);
    const key = `${leaveType}:${balanceYear}`;
    existingByTypeAndYear.set(key, { id: String(row.id) });
  }

  for (const entry of entitlementByType) {
    for (const period of periods) {
      const key = `${entry.leave_type}:${period.balance_year}`;
      const existing = existingByTypeAndYear.get(key);

      const payload: Record<string, string | number | null> = {
        employee_id: employeeId,
        leave_type: entry.leave_type,
        balance_year: period.balance_year,
        entitlement_days: entry.entitlement_days,
        used_days: 0,
        remaining_days: entry.entitlement_days,
        effective_from: period.effective_from,
        effective_to: period.effective_to,
        warning_threshold_days: 0,
        carried_forward_days: 0,
      };
      if (supportsContractId) {
        payload.contract_id = contractId;
      }

      if (existing?.id) {
        const { error: updateError } = await supabase
          .from("leave_balances")
          .update(payload)
          .eq("id", existing.id);
        if (updateError) {
          throw new Error(
            `Failed to update ${entry.leave_type} leave balance: ${updateError.message}`
          );
        }
        continue;
      }

      const { error: insertError } = await supabase
        .from("leave_balances")
        .insert(payload);
      if (insertError) {
        throw new Error(
          `Failed to create ${entry.leave_type} leave balance: ${insertError.message}`
        );
      }
    }
  }
}

export async function listContractLeaveBalanceSummary(input: {
  employee_id: string | null;
  contract_id: string;
  contract_start_date: string | null;
  contract_end_date: string | null;
}): Promise<LeaveBalanceRecord[]> {
  const employeeId = (input.employee_id ?? "").trim();
  const contractId = input.contract_id.trim();
  const startDate = (input.contract_start_date ?? "").trim();
  const endDate = (input.contract_end_date ?? "").trim();
  if (!employeeId || !contractId || !startDate || !endDate) {
    return [];
  }

  const periods = buildContractYearPeriods(startDate, endDate);
  const periodYears = extractYearsFromPeriods(periods);
  const supportsContractId = await hasLeaveBalanceContractIdColumn();
  const supabase = await createClient();

  let query = supabase
    .from("leave_balances")
    .select(LEAVE_BALANCE_SELECT)
    .eq("employee_id", employeeId)
    .in("balance_year", periodYears)
    .in("leave_type", ["vacation_leave", "sick_leave"]);

  if (supportsContractId) {
    query = query.eq("contract_id", contractId);
  }

  const { data, error } = await query
    .order("balance_year", { ascending: true })
    .order("leave_type", { ascending: true });
  if (error) {
    throw new Error(`Failed to load contract leave balances: ${error.message}`);
  }
  return (data ?? []) as LeaveBalanceRecord[];
}

const LEAVE_TRANSACTION_SELECT = `
  id,
  employee_id,
  leave_balance_id,
  leave_type,
  transaction_type,
  start_date,
  end_date,
  days,
  reason,
  status,
  notes,
  medical_certificate_required,
  medical_certificate_received,
  return_to_work_date,
  created_at
`;

function buildEmployeeName(firstName?: string | null, lastName?: string | null): string | null {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || null;
}

export function normalizeLeaveType(value: string): LeaveType {
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  const withSuffix = normalized.endsWith("_leave")
    ? normalized
    : `${normalized}_leave`;

  return LEAVE_TYPES.includes(withSuffix as LeaveType)
    ? (withSuffix as LeaveType)
    : "special_leave";
}

export function formatLeaveType(value: string | null | undefined): string {
  if (!value) return "-";
  return normalizeLeaveType(value)
    .replace(/_leave$/, "")
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function includesText(value: string | null | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

function dateStringInDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function calculateDays(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diff = end.getTime() - start.getTime();
  if (diff < 0) return null;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

async function enrichLeaveTransactions(
  rows: LeaveTransactionRow[]
): Promise<LeaveTransactionRecord[]> {
  const employeeIds = [
    ...new Set(
      rows
        .map((row) => row.employee_id)
        .filter((employeeId): employeeId is string => Boolean(employeeId))
    ),
  ];
  const balanceIds = [
    ...new Set(
      rows
        .map((row) => row.leave_balance_id)
        .filter((balanceId): balanceId is string => Boolean(balanceId))
    ),
  ];

  const supabase = await createClient();
  const employeeById = new Map<string, EmployeeNameRow>();
  const balanceById = new Map<string, LeaveBalanceRecord>();

  if (employeeIds.length) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_number, first_name, last_name")
      .in("id", employeeIds);

    if (error) {
      throw new Error(`Failed to load leave employee names: ${error.message}`);
    }

    for (const employee of data ?? []) {
      employeeById.set(employee.id, employee as EmployeeNameRow);
    }
  }

  if (balanceIds.length) {
    const { data, error } = await supabase
      .from("leave_balances")
      .select(LEAVE_BALANCE_SELECT)
      .in("id", balanceIds);

    if (error) {
      throw new Error(`Failed to load leave balances for transactions: ${error.message}`);
    }

    for (const balance of data ?? []) {
      balanceById.set(balance.id, balance as LeaveBalanceRecord);
    }
  }

  return rows.map((row) => {
    const employee = row.employee_id ? employeeById.get(row.employee_id) : undefined;
    const balance = row.leave_balance_id ? balanceById.get(row.leave_balance_id) : undefined;

    return {
      ...row,
      employee_name: buildEmployeeName(employee?.first_name, employee?.last_name),
      employee_first_name: employee?.first_name ?? null,
      employee_last_name: employee?.last_name ?? null,
      employee_number: employee?.employee_number ?? null,
      total_days: row.days,
      entitlement_days: balance?.entitlement_days ?? null,
      days_taken: balance?.used_days ?? null,
      balance_days: balance?.remaining_days ?? null,
      approval_status: row.status,
      approved_by: null,
      approval_date: row.status === "approved" ? row.created_at : null,
      rejection_reason: row.status === "rejected" ? row.reason : null,
    };
  });
}

export async function listLeaveBalances(): Promise<LeaveBalanceRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_balances")
    .select(LEAVE_BALANCE_SELECT)
    .order("balance_year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listLeaveBalances error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load leave balances: ${error.message}`);
  }

  return data ?? [];
}

export async function listLeaveBalancesByEmployeeId(
  employeeId: string
): Promise<LeaveBalanceRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_balances")
    .select(LEAVE_BALANCE_SELECT)
    .eq("employee_id", employeeId)
    .order("balance_year", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "listLeaveBalancesByEmployeeId error:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Failed to load employee leave balances: ${error.message}`);
  }

  return data ?? [];
}

export type LeaveListParams = {
  query?: string;
};

export type CreateLeaveApplicationInput = {
  employee_id: string | null;
  leave_type: string;
  start_date: string | null;
  end_date: string | null;
  total_days?: number | null;
  reason?: string | null;
  notes?: string | null;
  medical_certificate_required?: boolean;
  medical_certificate_received?: boolean;
  return_to_work_date?: string | null;
};

function normalizeContractStatus(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized || "inactive";
}

function getEffectiveContractStatusForLeave(contract: {
  contract_status?: string | null;
  end_date?: string | null;
}): string {
  const today = todayDateString();
  const endDate = (contract.end_date ?? "").trim();
  if (endDate && endDate < today) {
    return "expired";
  }
  return normalizeContractStatus(contract.contract_status);
}

async function listActiveContractsForEmployee(
  employeeId: string
): Promise<ContractCoverageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, employee_id, contract_status, start_date, end_date")
    .eq("employee_id", employeeId)
    .not("start_date", "is", null)
    .not("end_date", "is", null);

  if (error) {
    throw new Error(`Failed to validate contract period for leave: ${error.message}`);
  }

  return ((data ?? []) as ContractCoverageRow[]).filter(
    (contract) => getEffectiveContractStatusForLeave(contract) === "active"
  );
}

export async function getContractCoveringLeavePeriod(
  employeeId: string,
  startDate: string,
  endDate: string
): Promise<ContractCoverageRow | null> {
  const employee = employeeId.trim();
  const start = startDate.trim();
  const end = endDate.trim();
  if (!employee || !start || !end) return null;

  const activeContracts = await listActiveContractsForEmployee(employee);
  return (
    activeContracts.find(
      (contract) =>
        Boolean(contract.start_date) &&
        Boolean(contract.end_date) &&
        String(contract.start_date) <= start &&
        String(contract.end_date) >= end
    ) ?? null
  );
}

export async function validateLeaveWithinContractPeriod(
  employeeId: string | null | undefined,
  startDate: string | null | undefined,
  endDate: string | null | undefined
): Promise<void> {
  const employee = (employeeId ?? "").trim();
  const start = (startDate ?? "").trim();
  const end = (endDate ?? "").trim();
  if (!employee || !start || !end) {
    throw new Error("Leave dates must fall within the employee’s active contract period.");
  }

  const coveringContract = await getContractCoveringLeavePeriod(employee, start, end);
  if (coveringContract) return;

  const activeContracts = await listActiveContractsForEmployee(employee);
  if (activeContracts.length === 0) {
    throw new Error("Leave dates must fall within the employee’s active contract period.");
  }

  const earliestStart = activeContracts
    .map((contract) => String(contract.start_date ?? ""))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b))[0];
  const latestEnd = activeContracts
    .map((contract) => String(contract.end_date ?? ""))
    .filter(Boolean)
    .sort((a, b) => b.localeCompare(a))[0];

  if (earliestStart && start < earliestStart) {
    throw new Error("Leave cannot start before the employee’s contract start date.");
  }
  if (latestEnd && end > latestEnd) {
    throw new Error("Leave cannot extend beyond the employee’s contract end date.");
  }

  throw new Error("Leave dates must fall within the employee’s active contract period.");
}

export async function hasLeaveDateOverlap(input: {
  employeeId: string | null | undefined;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  excludeLeaveTransactionId?: string | null | undefined;
}): Promise<boolean> {
  const employeeId = (input.employeeId ?? "").trim();
  const startDate = (input.startDate ?? "").trim();
  const endDate = (input.endDate ?? "").trim();
  const excludeId = (input.excludeLeaveTransactionId ?? "").trim();

  if (!employeeId || !startDate || !endDate) return false;

  const supabase = await createClient();
  let query = supabase
    .from("leave_transactions")
    .select("id")
    .eq("employee_id", employeeId)
    .in("status", ["pending", "approved"])
    .not("start_date", "is", null)
    .not("end_date", "is", null)
    .lte("start_date", endDate)
    .gte("end_date", startDate)
    .limit(1);

  if (excludeId) {
    query = query.neq("id", excludeId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to validate overlapping leave dates: ${error.message}`);
  }

  return (data ?? []).length > 0;
}

export async function listLeaveTransactions(
  params?: LeaveListParams
): Promise<LeaveTransactionRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim().toLowerCase();

  const { data, error } = await supabase
    .from("leave_transactions")
    .select(LEAVE_TRANSACTION_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listLeaveTransactions error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load leave transactions: ${error.message}`);
  }

  const enriched = await enrichLeaveTransactions((data ?? []) as LeaveTransactionRow[]);

  if (!queryText) return enriched;

  return enriched.filter((row) => {
    return (
      includesText(row.employee_name, queryText) ||
      includesText(row.employee_first_name, queryText) ||
      includesText(row.employee_last_name, queryText) ||
      includesText(row.employee_number, queryText) ||
      includesText(row.employee_id, queryText) ||
      includesText(row.leave_type, queryText) ||
      includesText(formatLeaveType(row.leave_type), queryText) ||
      includesText(row.transaction_type, queryText) ||
      includesText(row.status, queryText) ||
      includesText(row.approval_status, queryText)
    );
  });
}

export async function listLeaveTransactionsByEmployeeId(
  employeeId: string
): Promise<LeaveTransactionRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_transactions")
    .select(LEAVE_TRANSACTION_SELECT)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "listLeaveTransactionsByEmployeeId error:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Failed to load employee leave transactions: ${error.message}`);
  }

  return enrichLeaveTransactions((data ?? []) as LeaveTransactionRow[]);
}

export async function getLeaveTransactionById(
  id: string
): Promise<LeaveTransactionRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_transactions")
    .select(LEAVE_TRANSACTION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load leave transaction: ${error.message}`);
  }

  if (!data) return null;
  const [record] = await enrichLeaveTransactions([data as LeaveTransactionRow]);
  return record ?? null;
}

export async function createLeaveApplication(
  input: CreateLeaveApplicationInput
): Promise<LeaveTransactionRecord> {
  const supabase = await createClient();
  const employeeId = (input.employee_id ?? "").trim();
  const startDate = (input.start_date ?? "").trim();
  const endDate = (input.end_date ?? "").trim();

  await validateLeaveWithinContractPeriod(employeeId, startDate, endDate);

  const overlapping = await hasLeaveDateOverlap({
    employeeId,
    startDate,
    endDate,
  });
  if (overlapping) {
    throw new Error("Leave dates overlap with an existing leave record for this employee.");
  }

  const calculatedDays =
    input.total_days ??
    (startDate && endDate
      ? calculateDays(startDate, endDate)
      : null);
  const normalizedLeaveType = normalizeLeaveType(input.leave_type);

  const { data, error } = await supabase
    .from("leave_transactions")
    .insert({
      employee_id: input.employee_id,
      leave_type: normalizedLeaveType,
      transaction_type: "application",
      start_date: input.start_date,
      end_date: input.end_date,
      days: calculatedDays,
      reason: input.reason,
      status: "pending",
      notes: input.notes,
      medical_certificate_required: input.medical_certificate_required ?? false,
      medical_certificate_received: input.medical_certificate_received ?? false,
      return_to_work_date: input.return_to_work_date,
    })
    .select(LEAVE_TRANSACTION_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to apply leave: ${error.message}`);
  }

  const [record] = await enrichLeaveTransactions([data as LeaveTransactionRow]);
  return record;
}

export async function applyLeaveAction(input: {
  id: string;
  action: LeaveAction;
  approved_by?: string;
  rejection_reason?: string;
  return_to_work_date?: string;
  notes?: string;
}): Promise<LeaveTransactionRecord> {
  const supabase = await createClient();
  const today = todayDateString();
  const notes = input.notes?.trim() || null;
  const rejectionReason = input.rejection_reason?.trim() || null;

  let patch: Record<string, string | boolean | null> = {};

  if (input.action === "approve_leave") {
    patch = {
      status: "approved",
      notes: notes ?? `Approved by ${input.approved_by?.trim() || "HR"}`,
    };
  } else if (input.action === "reject_leave") {
    if (!rejectionReason) {
      throw new Error("Rejection reason is required.");
    }
    patch = {
      status: "rejected",
      reason: rejectionReason,
      notes,
    };
  } else if (input.action === "cancel_leave") {
    patch = {
      status: "cancelled",
      notes,
    };
  } else if (input.action === "return_from_leave") {
    patch = {
      status: "returned",
      return_to_work_date: input.return_to_work_date?.trim() || today,
      notes,
    };
  } else {
    throw new Error("Unsupported leave action.");
  }

  const { data, error } = await supabase
    .from("leave_transactions")
    .update(patch)
    .eq("id", input.id)
    .select(LEAVE_TRANSACTION_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update leave workflow: ${error.message}`);
  }

  const [record] = await enrichLeaveTransactions([data as LeaveTransactionRow]);
  return record;
}

export async function countEmployeesOnLeave(): Promise<number> {
  const supabase = await createClient();
  const today = todayDateString();

  const { data, error } = await supabase
    .from("leave_transactions")
    .select("employee_id")
    .eq("status", "approved")
    .lte("start_date", today)
    .gte("end_date", today);

  if (error) {
    throw new Error(`Failed to count employees on leave: ${error.message}`);
  }

  return new Set((data ?? []).map((row) => row.employee_id).filter(Boolean)).size;
}

export async function countPendingLeaveApprovals(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("leave_transactions")
    .select("id", { head: true, count: "exact" })
    .eq("status", "pending");

  if (error) {
    throw new Error(`Failed to count pending leave approvals: ${error.message}`);
  }

  return count ?? 0;
}

export async function countLowLeaveBalanceAlerts(): Promise<number> {
  const balances = await listLeaveBalances();

  return balances.filter((row) => {
    const remaining = Number(row.remaining_days ?? 0);
    const threshold = Number(row.warning_threshold_days ?? 0);
    return row.low_balance_warning_enabled !== false && remaining <= threshold;
  }).length;
}

export async function generateLeaveWorkflowAlerts(): Promise<number> {
  const supabase = await createClient();
  const today = todayDateString();
  const approvalCutoff = dateStringInDays(-7);

  const [balances, transactions] = await Promise.all([
    listLeaveBalances(),
    listLeaveTransactions(),
  ]);

  const lowSick = balances.filter((balance) => {
    const remaining = Number(balance.remaining_days ?? 0);
    const threshold = Number(balance.warning_threshold_days ?? 0);
    return (
      normalizeLeaveType(balance.leave_type ?? "") === "sick_leave" &&
      balance.low_balance_warning_enabled !== false &&
      remaining <= threshold
    );
  });

  const lowVacation = balances.filter((balance) => {
    const remaining = Number(balance.remaining_days ?? 0);
    const threshold = Number(balance.warning_threshold_days ?? 0);
    return (
      normalizeLeaveType(balance.leave_type ?? "") === "vacation_leave" &&
      balance.low_balance_warning_enabled !== false &&
      remaining <= threshold
    );
  });

  const outstandingApprovals = transactions.filter((transaction) => {
    return (
      transaction.approval_status === "pending" &&
      (transaction.created_at ?? today) <= approvalCutoff
    );
  });

  const payload = [
    ...lowSick.map((balance) => ({
      correlation_id: `leave-low-sick-${balance.id}`,
      alert_title: "Low Sick Leave Balance",
      alert_message: `Sick leave balance is ${balance.remaining_days ?? 0} day(s), at or below threshold.`,
      module_name: "Leave",
      severity_level: "warning",
      status: "active",
      entity_type: "leave_balance",
      entity_id: balance.id,
      employee_id: balance.employee_id,
      triggered_at: new Date().toISOString(),
    })),
    ...lowVacation.map((balance) => ({
      correlation_id: `leave-low-vacation-${balance.id}`,
      alert_title: "Low Vacation Leave Balance",
      alert_message: `Vacation leave balance is ${balance.remaining_days ?? 0} day(s), at or below threshold.`,
      module_name: "Leave",
      severity_level: "warning",
      status: "active",
      entity_type: "leave_balance",
      entity_id: balance.id,
      employee_id: balance.employee_id,
      triggered_at: new Date().toISOString(),
    })),
    ...outstandingApprovals.map((transaction) => ({
      correlation_id: `leave-outstanding-approval-${transaction.id}`,
      alert_title: "Long Outstanding Leave Approval",
      alert_message: `Leave request for ${transaction.employee_name ?? transaction.employee_id ?? "employee"} has been pending for more than 7 days.`,
      module_name: "Leave",
      severity_level: "warning",
      status: "active",
      entity_type: "leave_transaction",
      entity_id: transaction.id,
      employee_id: transaction.employee_id,
      triggered_at: new Date().toISOString(),
    })),
  ];

  if (!payload.length) return 0;

  const { error } = await supabase
    .from("alerts")
    .upsert(payload, { onConflict: "correlation_id" });

  if (error) {
    throw new Error(`Failed to generate leave alerts: ${error.message}`);
  }

  return payload.length;
}

export async function listLowSickLeave(): Promise<LeaveBalanceRecord[]> {
  const balances = await listLeaveBalances();

  return balances
    .filter((row) => {
      const remaining = Number(row.remaining_days ?? 0);
      const threshold = Number(row.warning_threshold_days ?? 0);

      return (
        normalizeLeaveType(row.leave_type ?? "") === "sick_leave" &&
        row.low_balance_warning_enabled !== false &&
        remaining <= threshold
      );
    })
    .sort(
      (a, b) =>
        Number(a.remaining_days ?? 0) - Number(b.remaining_days ?? 0)
    );
}

export async function listLowVacationLeave(): Promise<LeaveBalanceRecord[]> {
  const balances = await listLeaveBalances();

  return balances
    .filter((row) => {
      const remaining = Number(row.remaining_days ?? 0);
      const threshold = Number(row.warning_threshold_days ?? 0);

      return (
        normalizeLeaveType(row.leave_type ?? "") === "vacation_leave" &&
        row.low_balance_warning_enabled !== false &&
        remaining <= threshold
      );
    })
    .sort(
      (a, b) =>
        Number(a.remaining_days ?? 0) - Number(b.remaining_days ?? 0)
    );
}

export async function listExhaustedSickLeave(): Promise<LeaveBalanceRecord[]> {
  const balances = await listLeaveBalances();

  return balances
    .filter((row) => {
      const remaining = Number(row.remaining_days ?? 0);

      return (
        normalizeLeaveType(row.leave_type ?? "") === "sick_leave" &&
        row.exhausted_warning_enabled !== false &&
        remaining <= 0
      );
    })
    .sort(
      (a, b) =>
        Number(a.remaining_days ?? 0) - Number(b.remaining_days ?? 0)
    );
}