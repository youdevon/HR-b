import { createClient } from "@/lib/supabase/server";
import { upsertContractLeaveEntitlements } from "@/lib/queries/leave";

export type ContractRecord = {
  id: string;
  employee_id: string | null;

  employee_name: string | null;
  employee_first_name: string | null;
  employee_last_name: string | null;
  employee_number: string | null;

  contract_number: string | null;
  contract_title: string | null;
  contract_type: string | null;
  contract_status: string | null;
  effective_contract_status: string;

  start_date: string | null;
  end_date: string | null;

  department: string | null;
  job_title: string | null;

  salary_amount: number | null;
  salary_frequency: string | null;
  is_gratuity_eligible: boolean | null;
  vacation_leave_days: number | null;
  sick_leave_days: number | null;

  probation_end_date: string | null;
  renewal_due_date: string | null;
  renewal_status: string | null;
  confirmation_status: string | null;
  renewal_notes: string | null;
  hr_owner: string | null;

  created_at: string | null;
};

export type ContractAllowanceRecord = {
  id: string;
  contract_id: string;
  allowance_name: string;
  allowance_type: string | null;
  allowance_amount: number;
  allowance_frequency: string;
  is_taxable: boolean;
  notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type ContractAllowanceInput = {
  allowance_name: string;
  allowance_type?: string | null;
  allowance_amount: number;
  allowance_frequency: "monthly" | "fortnightly" | "weekly" | "daily" | "one_time";
  is_taxable: boolean;
  notes?: string | null;
};

export type ExpiringContractAlertRecord = ContractRecord & {
  days_to_expiry: number;
  is_reviewed: boolean;
};

export type ExpiredContractAlertRecord = ContractRecord & {
  days_expired: number;
};

export type ContractSearchParams = {
  query?: string;
  status?: "all" | "active";
};

export function normalizeExpiringContractDays(days?: number): 30 | 60 | 90 {
  if (days === 30 || days === 60 || days === 90) {
    return days;
  }
  return 90;
}

export function getCurrentActiveContract(
  contracts: Array<Pick<ContractRecord, "effective_contract_status" | "start_date" | "end_date">>
): (Pick<ContractRecord, "effective_contract_status" | "start_date" | "end_date"> & {
  start_date: string;
  end_date: string;
}) | null {
  const today = todayDateString();
  const active = contracts
    .filter(
      (contract): contract is Pick<
        ContractRecord,
        "effective_contract_status" | "start_date" | "end_date"
      > & { start_date: string; end_date: string } =>
        contract.effective_contract_status === "active" &&
        Boolean(contract.start_date) &&
        Boolean(contract.end_date)
    )
    .filter((contract) => contract.start_date <= today && contract.end_date >= today)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
  return active[0] ?? null;
}

export type ContractLifecycleAction =
  | "renew_contract"
  | "confirm_employee"
  | "extend_probation";

const CONTRACT_LIST_SELECT = `
  id,
  employee_id,
  contract_number,
  contract_title,
  contract_type,
  contract_status,
  start_date,
  end_date,
  department,
  job_title,
  salary_amount,
  salary_frequency,
  is_gratuity_eligible,
  vacation_leave_days,
  sick_leave_days,
  probation_end_date,
  renewal_due_date,
  renewal_status,
  confirmation_status,
  renewal_notes,
  hr_owner,
  created_at
`;

// SQL guidance if the column is missing:
// alter table public.contracts
// add column if not exists is_gratuity_eligible boolean not null default false;
// alter table public.contracts
// add column if not exists vacation_leave_days numeric default 0,
// add column if not exists sick_leave_days numeric default 0;

type ContractDatabaseRow = {
  id: string;
  employee_id: string | null;
  contract_number: string | null;
  contract_title: string | null;
  contract_type: string | null;
  contract_status: string | null;
  start_date: string | null;
  end_date: string | null;
  department: string | null;
  job_title: string | null;
  salary_amount: number | null;
  salary_frequency: string | null;
  is_gratuity_eligible: boolean | null;
  vacation_leave_days: number | null;
  sick_leave_days: number | null;
  probation_end_date: string | null;
  renewal_due_date: string | null;
  renewal_status: string | null;
  confirmation_status: string | null;
  renewal_notes: string | null;
  hr_owner: string | null;
  created_at: string | null;
};

const CONTRACT_TYPE_VALUES = new Set(["temporary", "fixed_term"]);
const CONTRACT_STATUS_VALUES = new Set(["active", "expired", "inactive"]);
const SALARY_FREQUENCY_VALUES = new Set([
  "monthly",
  "fortnightly",
  "weekly",
  "daily",
]);
const ALLOWANCE_FREQUENCY_VALUES = new Set([
  "monthly",
  "fortnightly",
  "weekly",
  "daily",
  "one_time",
]);
const DAILY_ALLOWANCE_TO_MONTHLY_DAYS = 22;

// SQL guidance:
// create table if not exists public.contract_allowances (
//   id uuid primary key default gen_random_uuid(),
//   contract_id uuid not null references public.contracts(id) on delete cascade,
//   allowance_name text not null,
//   allowance_type text,
//   allowance_amount numeric not null default 0,
//   allowance_frequency text not null default 'monthly',
//   is_taxable boolean not null default false,
//   notes text,
//   created_at timestamptz not null default now(),
//   updated_at timestamptz not null default now()
// );
// create index if not exists idx_contract_allowances_contract_id
// on public.contract_allowances(contract_id);

type EmployeeNameRow = {
  id: string;
  employee_number: string | null;
  first_name: string | null;
  last_name: string | null;
};

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function plusDaysDateString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateText: string | null): Date | null {
  if (!dateText) return null;

  const [yearText, monthText, dayText] = dateText.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day);
}

export function calculateContractYearCount(
  startDateText: string | null,
  endDateText: string | null
): number {
  const start = parseLocalDate(startDateText);
  const end = parseLocalDate(endDateText);
  if (!start || !end || end.getTime() < start.getTime()) {
    return 0;
  }

  let count = 0;
  let cursor = new Date(start);
  while (cursor.getTime() <= end.getTime()) {
    count += 1;
    const next = new Date(cursor);
    next.setFullYear(next.getFullYear() + 1);
    cursor = next;
  }
  return count;
}

function currentLocalDateAtMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function includesText(value: string | null | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

function buildEmployeeName(firstName?: string | null, lastName?: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || null;
}

function normalizeContractStatus(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized || "inactive";
}

export function getEffectiveContractStatus(contract: {
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

export function isContractActiveForPeriod(
  contract: {
    contract_status?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  },
  startDate: string,
  endDate: string
): boolean {
  const effectiveStatus = getEffectiveContractStatus(contract);
  const contractStart = (contract.start_date ?? "").trim();
  const contractEnd = (contract.end_date ?? "").trim();
  if (!contractStart || !contractEnd || !startDate || !endDate) {
    return false;
  }
  return (
    effectiveStatus === "active" &&
    contractStart <= startDate &&
    contractEnd >= endDate
  );
}

function assertValidContractType(value: string): string {
  const normalizedInput = value.trim().toLowerCase();
  const normalized = normalizedInput === "short_term" ? "temporary" : normalizedInput;
  if (!CONTRACT_TYPE_VALUES.has(normalized)) {
    throw new Error("Contract type must be temporary or fixed_term.");
  }
  return normalized;
}

function assertValidContractStatus(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!CONTRACT_STATUS_VALUES.has(normalized)) {
    throw new Error("Contract status must be active, expired, or inactive.");
  }
  return normalized;
}

function assertValidSalaryFrequency(value: string | null): string {
  const normalized = (value ?? "monthly").trim().toLowerCase() || "monthly";
  if (!SALARY_FREQUENCY_VALUES.has(normalized)) {
    throw new Error(
      "Salary frequency must be monthly, fortnightly, weekly, or daily."
    );
  }
  return normalized;
}

function assertRequiredEmployeeId(value: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error("Employee is required.");
  }
  return normalized;
}

function normalizeAllowanceType(value: string | null | undefined): string | null {
  const normalized = (value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || null;
}

function normalizeAllowanceName(value: string): string {
  const normalized = value.trim();
  if (!normalized) throw new Error("Allowance name is required.");
  return normalized;
}

function normalizeAllowanceFrequency(value: string): ContractAllowanceInput["allowance_frequency"] {
  const normalized = value.trim().toLowerCase();
  if (!ALLOWANCE_FREQUENCY_VALUES.has(normalized)) {
    throw new Error("Allowance frequency must be monthly, fortnightly, weekly, daily, or one_time.");
  }
  return normalized as ContractAllowanceInput["allowance_frequency"];
}

function normalizeAllowanceAmount(value: number): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Allowance amount must be greater than or equal to 0.");
  }
  return Number(value.toFixed(2));
}

export function toMonthlyAllowanceAmount(
  amount: number,
  frequency: string,
  dailyToMonthlyDays = DAILY_ALLOWANCE_TO_MONTHLY_DAYS
): number {
  const normalizedAmount = Number.isFinite(amount) ? amount : 0;
  const normalizedFrequency = frequency.trim().toLowerCase();
  if (normalizedFrequency === "monthly") return normalizedAmount;
  if (normalizedFrequency === "fortnightly") return normalizedAmount * 2;
  if (normalizedFrequency === "weekly") return normalizedAmount * 4;
  if (normalizedFrequency === "daily") return normalizedAmount * dailyToMonthlyDays;
  return 0;
}

export function calculateTotalMonthlyAllowances(
  allowances: Array<Pick<ContractAllowanceRecord, "allowance_amount" | "allowance_frequency">>
): number {
  return Number(
    allowances
      .reduce(
        (sum, allowance) =>
          sum + toMonthlyAllowanceAmount(Number(allowance.allowance_amount ?? 0), allowance.allowance_frequency),
        0
      )
      .toFixed(2)
  );
}

function assertContractTitleFromEmployeeName(input: {
  employee_first_name: string | null;
  employee_last_name: string | null;
}): string {
  const fullName = buildEmployeeName(input.employee_first_name, input.employee_last_name);
  if (!fullName) {
    throw new Error("Contract title could not be generated because employee name is missing.");
  }
  return fullName;
}

function assertNonNegativeLeaveDays(value: number | null, label: string): number {
  const normalized = value ?? 0;
  if (!Number.isFinite(normalized) || normalized < 0) {
    throw new Error(`${label} must be greater than or equal to 0.`);
  }
  return Number(normalized.toFixed(2));
}

export type CreateContractInput = {
  employee_id: string;
  contract_number: string;
  contract_type: string;
  contract_status: string;
  start_date: string;
  end_date: string;
  salary_amount: number | null;
  salary_frequency: string | null;
  is_gratuity_eligible: boolean;
  vacation_leave_days: number | null;
  sick_leave_days: number | null;
  allowances?: ContractAllowanceInput[];
};

export async function createContractRecord(
  input: CreateContractInput
): Promise<ContractRecord> {
  const employeeId = assertRequiredEmployeeId(input.employee_id);
  const contractNumber = input.contract_number.trim();
  if (!contractNumber) {
    throw new Error("Contract number is required.");
  }
  if (!input.start_date.trim()) {
    throw new Error("Start date is required.");
  }
  if (!input.end_date.trim()) {
    throw new Error("End date is required.");
  }
  if (input.end_date < input.start_date) {
    throw new Error("End date must be after or equal to start date.");
  }
  if (input.salary_amount !== null && input.salary_amount < 0) {
    throw new Error("Monthly salary must be greater than or equal to 0.");
  }

  const contractType = assertValidContractType(input.contract_type);
  const contractStatus = assertValidContractStatus(input.contract_status);
  const salaryFrequency = assertValidSalaryFrequency(input.salary_frequency);
  const vacationLeaveDays = assertNonNegativeLeaveDays(
    input.vacation_leave_days,
    "Vacation leave days"
  );
  const sickLeaveDays = assertNonNegativeLeaveDays(
    input.sick_leave_days,
    "Sick leave days"
  );

  const supabase = await createClient();
  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id, first_name, last_name")
    .eq("id", employeeId)
    .maybeSingle();
  if (employeeError || !employee) {
    throw new Error(
      `Failed to load selected employee: ${employeeError?.message ?? "Employee not found."}`
    );
  }
  const contractTitle = assertContractTitleFromEmployeeName({
    employee_first_name: employee.first_name,
    employee_last_name: employee.last_name,
  });

  await assertNoContractDateOverlap({
    employeeId,
    newStartDate: input.start_date,
    newEndDate: input.end_date,
  });

  const { data, error } = await supabase
    .from("contracts")
    .insert({
      employee_id: employeeId,
      contract_number: contractNumber,
      contract_title: contractTitle,
      contract_type: contractType,
      contract_status: contractStatus,
      start_date: input.start_date,
      end_date: input.end_date,
      salary_amount: input.salary_amount,
      salary_frequency: salaryFrequency,
      is_gratuity_eligible: input.is_gratuity_eligible,
      vacation_leave_days: vacationLeaveDays,
      sick_leave_days: sickLeaveDays,
    })
    .select(CONTRACT_LIST_SELECT)
    .single();
  if (error) {
    throw new Error(`Failed to create contract: ${error.message}`);
  }

  const created = data as ContractDatabaseRow;
  await replaceContractAllowances(created.id, input.allowances ?? []);
  await upsertContractLeaveEntitlements({
    employee_id: employeeId,
    contract_id: created.id,
    contract_start_date: created.start_date ?? input.start_date,
    contract_end_date: created.end_date ?? input.end_date,
    vacation_leave_days: vacationLeaveDays,
    sick_leave_days: sickLeaveDays,
  });

  const [enriched] = await enrichContractsWithEmployeeNames([created]);
  if (!enriched) {
    throw new Error("Contract was created but could not be loaded.");
  }
  return enriched;
}

async function enrichContractsWithEmployeeNames(
  contracts: ContractDatabaseRow[]
): Promise<ContractRecord[]> {
  const employeeIds = [
    ...new Set(
      contracts
        .map((contract) => contract.employee_id)
        .filter((employeeId): employeeId is string => Boolean(employeeId))
    ),
  ];

  if (!employeeIds.length) {
    return contracts.map((contract) => ({
      ...contract,
      effective_contract_status: getEffectiveContractStatus(contract),
      employee_name: null,
      employee_first_name: null,
      employee_last_name: null,
      employee_number: null,
    }));
  }

  const supabase = await createClient();

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, employee_number, first_name, last_name")
    .in("id", employeeIds);

  if (error) {
    throw new Error(
      `Failed to load employee names for contracts: ${error.message}`
    );
  }

  const employeeById = new Map(
    (employees ?? []).map((employee) => [
      employee.id,
      employee as EmployeeNameRow,
    ])
  );

  return contracts.map((contract) => {
    const employee = contract.employee_id
      ? employeeById.get(contract.employee_id)
      : undefined;

    return {
      ...contract,
      effective_contract_status: getEffectiveContractStatus(contract),
      employee_name: buildEmployeeName(
        employee?.first_name,
        employee?.last_name
      ),
      employee_first_name: employee?.first_name ?? null,
      employee_last_name: employee?.last_name ?? null,
      employee_number: employee?.employee_number ?? null,
    };
  });
}

export async function listContracts(
  params?: ContractSearchParams
): Promise<ContractRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();
  const statusFilter = params?.status === "active" ? "active" : "all";

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listContracts error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load contracts: ${error.message}`);
  }

  const contracts = await enrichContractsWithEmployeeNames(
    (data ?? []) as ContractDatabaseRow[]
  );
  const scopedContracts =
    statusFilter === "active"
      ? contracts.filter((contract) => contract.effective_contract_status === "active")
      : contracts;

  if (!queryText) {
    return scopedContracts;
  }

  const normalizedQuery = queryText.toLowerCase();

  return scopedContracts.filter((contract) => {
    return (
      includesText(contract.contract_number, normalizedQuery) ||
      includesText(contract.contract_title, normalizedQuery) ||
      includesText(contract.contract_type, normalizedQuery) ||
      includesText(contract.contract_status, normalizedQuery) ||
      includesText(contract.department, normalizedQuery) ||
      includesText(contract.job_title, normalizedQuery) ||
      includesText(contract.employee_name, normalizedQuery) ||
      includesText(contract.employee_first_name, normalizedQuery) ||
      includesText(contract.employee_last_name, normalizedQuery) ||
      includesText(contract.employee_number, normalizedQuery)
    );
  });
}

export async function getContractById(
  id: string
): Promise<ContractRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getContractById error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load contract: ${error.message}`);
  }

  if (!data) return null;

  const [contract] = await enrichContractsWithEmployeeNames([
    data as ContractDatabaseRow,
  ]);

  return contract ?? null;
}

export async function listContractAllowancesByContractIds(
  contractIds: string[]
): Promise<Map<string, ContractAllowanceRecord[]>> {
  const uniqueIds = [...new Set(contractIds.filter(Boolean))];
  const byContractId = new Map<string, ContractAllowanceRecord[]>();
  if (!uniqueIds.length) return byContractId;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contract_allowances")
    .select(
      "id, contract_id, allowance_name, allowance_type, allowance_amount, allowance_frequency, is_taxable, notes, created_at, updated_at"
    )
    .in("contract_id", uniqueIds)
    .order("created_at", { ascending: true });

  // Graceful fallback when table has not been created yet.
  if (error) {
    if ((error as { code?: string }).code === "42P01") return byContractId;
    throw new Error(`Failed to load contract allowances: ${error.message}`);
  }

  for (const row of (data ?? []) as ContractAllowanceRecord[]) {
    const list = byContractId.get(row.contract_id) ?? [];
    list.push(row);
    byContractId.set(row.contract_id, list);
  }
  return byContractId;
}

export async function listContractAllowancesByContractId(
  contractId: string
): Promise<ContractAllowanceRecord[]> {
  const map = await listContractAllowancesByContractIds([contractId]);
  return map.get(contractId) ?? [];
}

async function replaceContractAllowances(
  contractId: string,
  allowances: ContractAllowanceInput[]
): Promise<void> {
  const supabase = await createClient();

  const { error: deleteError } = await supabase
    .from("contract_allowances")
    .delete()
    .eq("contract_id", contractId);
  if (deleteError && (deleteError as { code?: string }).code !== "42P01") {
    throw new Error(`Failed to clear contract allowances: ${deleteError.message}`);
  }

  const normalized = allowances
    .map((allowance) => {
      const allowanceName = normalizeAllowanceName(allowance.allowance_name);
      const allowanceAmount = normalizeAllowanceAmount(allowance.allowance_amount);
      const allowanceFrequency = normalizeAllowanceFrequency(allowance.allowance_frequency);
      return {
        contract_id: contractId,
        allowance_name: allowanceName,
        allowance_type: normalizeAllowanceType(allowance.allowance_type ?? allowanceName),
        allowance_amount: allowanceAmount,
        allowance_frequency: allowanceFrequency,
        is_taxable: allowance.is_taxable === true,
        notes: (allowance.notes ?? "").trim() || null,
      };
    })
    .filter((allowance) => allowance.allowance_name);

  if (!normalized.length) return;
  const { error: insertError } = await supabase.from("contract_allowances").insert(normalized);
  if (insertError) {
    if ((insertError as { code?: string }).code === "42P01") {
      throw new Error(
        "Contract allowances table is missing. Create public.contract_allowances before saving allowances."
      );
    }
    throw new Error(`Failed to save contract allowances: ${insertError.message}`);
  }
}

export async function listContractsByEmployeeId(
  employeeId: string,
  query?: string
): Promise<ContractRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "listContractsByEmployeeId error:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Failed to load employee contracts: ${error.message}`);
  }

  const contracts = await enrichContractsWithEmployeeNames(
    (data ?? []) as ContractDatabaseRow[]
  );
  const queryText = query?.trim().toLowerCase();
  if (!queryText) return contracts;

  return contracts.filter((contract) => {
    return (
      includesText(contract.contract_number, queryText) ||
      includesText(contract.contract_title, queryText) ||
      includesText(contract.contract_type, queryText) ||
      includesText(contract.contract_status, queryText) ||
      includesText(contract.department, queryText) ||
      includesText(contract.job_title, queryText) ||
      includesText(contract.employee_name, queryText) ||
      includesText(contract.employee_first_name, queryText) ||
      includesText(contract.employee_last_name, queryText) ||
      includesText(contract.employee_number, queryText)
    );
  });
}

export async function listExpiringContracts(
  days?: number
): Promise<ExpiringContractAlertRecord[]> {
  const supabase = await createClient();
  const normalizedDays = normalizeExpiringContractDays(days);
  const todayText = todayDateString();
  const withinDays = plusDaysDateString(normalizedDays);

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .not("end_date", "is", null)
    .gte("end_date", todayText)
    .lte("end_date", withinDays)
    .order("end_date", { ascending: true });

  if (error) {
    console.error("listExpiringContracts error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load expiring contracts: ${error.message}`);
  }

  const enriched = await enrichContractsWithEmployeeNames(
    (data ?? []) as ContractDatabaseRow[]
  );

  const today = currentLocalDateAtMidnight();

  const rows = enriched
    .filter((contract) => getEffectiveContractStatus(contract) === "active")
    .map((contract) => {
    const endDate = parseLocalDate(contract.end_date);
    const daysToExpiry = endDate
      ? Math.max(
          0,
          Math.ceil(
            (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

      return {
        ...contract,
        days_to_expiry: daysToExpiry,
        is_reviewed: false,
      };
    });

  const contractIds = rows.map((row) => row.id);
  if (contractIds.length > 0) {
    const expiryPrefixes = [
      "contract_expiring-",
      "contract_expiring_critical-",
      "contracts_expiring_in_30_days-",
      "contracts_expiring_in_90_days-",
      "expired_contracts-",
    ];
    const { data: relatedAlerts, error: relatedAlertsError } = await supabase
      .from("alerts")
      .select("entity_id, status, correlation_id")
      .eq("module_name", "Contracts")
      .eq("entity_type", "contract")
      .in("entity_id", contractIds)
      .in("status", ["active", "acknowledged", "resolved"]);

    if (relatedAlertsError) {
      throw new Error(
        `Failed to load related contract alerts: ${relatedAlertsError.message}`
      );
    }

    const statusByContractId = new Map<
      string,
      { hasActive: boolean; hasReviewed: boolean }
    >();
    for (const alert of relatedAlerts ?? []) {
      const entityId = String(alert.entity_id ?? "");
      const status = String(alert.status ?? "").toLowerCase();
      const correlationId = String(alert.correlation_id ?? "").toLowerCase();
      if (!entityId) continue;
      const isExpiryAlert = expiryPrefixes.some((prefix) =>
        correlationId.startsWith(prefix)
      );
      if (!isExpiryAlert) continue;
      const current = statusByContractId.get(entityId) ?? {
        hasActive: false,
        hasReviewed: false,
      };
      if (status === "active") current.hasActive = true;
      if (status === "acknowledged" || status === "resolved") {
        current.hasReviewed = true;
      }
      statusByContractId.set(entityId, current);
    }

    for (const row of rows) {
      const status = statusByContractId.get(row.id);
      row.is_reviewed = status ? !status.hasActive && status.hasReviewed : false;
    }
  }

  rows.sort((a, b) => {
    if (a.is_reviewed !== b.is_reviewed) {
      return a.is_reviewed ? 1 : -1;
    }
    return a.days_to_expiry - b.days_to_expiry;
  });

  return rows;
}

export async function listExpiredContracts(): Promise<
  ExpiredContractAlertRecord[]
> {
  const supabase = await createClient();
  const todayText = todayDateString();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .not("end_date", "is", null)
    .lt("end_date", todayText)
    .order("end_date", { ascending: false });

  if (error) {
    console.error("listExpiredContracts error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load expired contracts: ${error.message}`);
  }

  const enriched = await enrichContractsWithEmployeeNames(
    (data ?? []) as ContractDatabaseRow[]
  );

  const today = currentLocalDateAtMidnight();

  const rows = enriched.map((contract) => {
    const endDate = parseLocalDate(contract.end_date);
    const daysExpired = endDate
      ? Math.max(
          0,
          Math.floor(
            (today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    return {
      ...contract,
      days_expired: daysExpired,
    };
  });

  rows.sort((a, b) => b.days_expired - a.days_expired);

  return rows;
}

export async function listOverdueRenewals(): Promise<ContractRecord[]> {
  const supabase = await createClient();
  const todayText = todayDateString();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .not("renewal_due_date", "is", null)
    .lt("renewal_due_date", todayText)
    .neq("renewal_status", "renewed")
    .order("renewal_due_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load overdue renewals: ${error.message}`);
  }

  return enrichContractsWithEmployeeNames((data ?? []) as ContractDatabaseRow[]);
}

export async function countOverdueRenewals(): Promise<number> {
  const supabase = await createClient();
  const todayText = todayDateString();

  const { count, error } = await supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .not("renewal_due_date", "is", null)
    .lt("renewal_due_date", todayText)
    .neq("renewal_status", "renewed");

  if (error) {
    throw new Error(`Failed to count overdue renewals: ${error.message}`);
  }

  return count ?? 0;
}

export async function countPendingConfirmations(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .in("confirmation_status", ["pending", "for_confirmation"]);

  if (error) {
    throw new Error(`Failed to count pending confirmations: ${error.message}`);
  }

  return count ?? 0;
}

export async function applyContractLifecycleAction(input: {
  id: string;
  action: ContractLifecycleAction;
  start_date?: string;
  end_date?: string;
  renewal_due_date?: string;
  probation_end_date?: string;
  renewal_notes?: string;
  hr_owner?: string;
}): Promise<ContractRecord> {
  const supabase = await createClient();
  const now = new Date().toISOString().slice(0, 10);

  const { data: existing, error: existingError } = await supabase
    .from("contracts")
    .select("id, employee_id, end_date")
    .eq("id", input.id)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(
      `Failed to load contract for lifecycle update: ${
        existingError?.message ?? "Contract not found."
      }`
    );
  }

  const renewalStartDate = input.start_date?.trim() ?? "";
  const renewalEndDate = input.end_date?.trim() ?? "";

  let patch: Record<string, string | null> = {};

  if (input.action === "renew_contract") {
    const renewalDueDate = input.renewal_due_date?.trim() ?? "";
    const renewalNotes = input.renewal_notes?.trim() ?? "";

    if (!renewalStartDate || !renewalEndDate) {
      throw new Error("Renewal requires both start and end dates.");
    }
    if (!renewalDueDate) {
      throw new Error("Renewal due date is required.");
    }
    if (!renewalNotes) {
      throw new Error("Renewal notes are required.");
    }

    if (renewalEndDate < renewalStartDate) {
      throw new Error("Renewal end date cannot be earlier than renewal start date.");
    }

    if (existing.end_date && renewalStartDate <= existing.end_date) {
      throw new Error(
        "Contract dates overlap with an existing contract for this employee."
      );
    }

    await assertNoContractDateOverlap({
      employeeId: existing.employee_id,
      newStartDate: renewalStartDate,
      newEndDate: renewalEndDate,
      excludeContractId: input.id,
    });

    patch = {
      start_date: renewalStartDate,
      end_date: renewalEndDate,
      renewal_status: "renewed",
      contract_status: "active",
      renewal_due_date: renewalDueDate,
      renewal_notes: renewalNotes,
      hr_owner: input.hr_owner?.trim() || null,
    };
  }

  if (input.action === "confirm_employee") {
    patch = {
      confirmation_status: "confirmed",
      probation_end_date: input.probation_end_date?.trim() || now,
    };
  }

  if (input.action === "extend_probation") {
    patch = {
      confirmation_status: "pending",
      probation_end_date: input.probation_end_date?.trim() || null,
      renewal_notes: input.renewal_notes?.trim() || null,
      hr_owner: input.hr_owner?.trim() || null,
    };
  }

  if (!Object.keys(patch).length) {
    throw new Error("Unsupported contract lifecycle action.");
  }

  const { data, error } = await supabase
    .from("contracts")
    .update(patch)
    .eq("id", input.id)
    .select(CONTRACT_LIST_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to apply lifecycle action: ${error.message}`);
  }

  const [enriched] = await enrichContractsWithEmployeeNames([
    data as ContractDatabaseRow,
  ]);

  return enriched;
}

async function assertNoContractDateOverlap(input: {
  employeeId: string | null;
  newStartDate: string;
  newEndDate: string;
  excludeContractId?: string;
}): Promise<void> {
  if (!input.employeeId) return;

  const supabase = await createClient();

  let query = supabase
    .from("contracts")
    .select("id, start_date, end_date")
    .eq("employee_id", input.employeeId);

  if (input.excludeContractId) {
    query = query.neq("id", input.excludeContractId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to validate contract date overlap: ${error.message}`
    );
  }

  const hasOverlap = (data ?? []).some((contract) => {
    const existingStartDate = contract.start_date as string | null;
    const existingEndDate =
      (contract.end_date as string | null) ?? "9999-12-31";

    if (!existingStartDate) return false;

    return (
      input.newStartDate <= existingEndDate &&
      input.newEndDate >= existingStartDate
    );
  });

  if (hasOverlap) {
    throw new Error(
      "Contract dates overlap with an existing contract for this employee."
    );
  }
}

export async function validateContractDateOverlap(input: {
  employeeId: string | null;
  newStartDate: string;
  newEndDate: string;
  excludeContractId?: string;
}): Promise<void> {
  await assertNoContractDateOverlap(input);
}

type UpdateContractDetailsInput = {
  id: string;
  employee_id: string;
  contract_number: string;
  contract_title: string;
  contract_type: string;
  contract_status: string;
  start_date: string;
  end_date: string;
  salary_amount: number | null;
  salary_frequency: string | null;
  is_gratuity_eligible: boolean;
  vacation_leave_days: number | null;
  sick_leave_days: number | null;
  allowances?: ContractAllowanceInput[];
};

export async function updateContractDetails(
  input: UpdateContractDetailsInput
): Promise<ContractRecord> {
  const employeeId = assertRequiredEmployeeId(input.employee_id);
  if (!input.contract_number.trim()) {
    throw new Error("Contract number is required.");
  }
  if (!input.contract_title.trim()) {
    throw new Error("Contract title is required.");
  }
  if (!input.start_date.trim()) {
    throw new Error("Start date is required.");
  }
  if (!input.end_date.trim()) {
    throw new Error("End date is required.");
  }
  if (input.end_date < input.start_date) {
    throw new Error("End date must be after or equal to start date.");
  }
  if (input.salary_amount !== null && input.salary_amount < 0) {
    throw new Error("Monthly salary must be greater than or equal to 0.");
  }

  const contractType = assertValidContractType(input.contract_type);
  const contractStatus = assertValidContractStatus(input.contract_status);
  const salaryFrequency = assertValidSalaryFrequency(input.salary_frequency);
  const vacationLeaveDays = assertNonNegativeLeaveDays(
    input.vacation_leave_days,
    "Vacation leave days"
  );
  const sickLeaveDays = assertNonNegativeLeaveDays(
    input.sick_leave_days,
    "Sick leave days"
  );

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("contracts")
    .select("id, employee_id")
    .eq("id", input.id)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(
      `Failed to load contract for update: ${
        existingError?.message ?? "Contract not found."
      }`
    );
  }

  await assertNoContractDateOverlap({
    employeeId,
    newStartDate: input.start_date,
    newEndDate: input.end_date,
    excludeContractId: input.id,
  });

  const { data, error } = await supabase
    .from("contracts")
    .update({
      employee_id: employeeId,
      contract_number: input.contract_number,
      contract_title: input.contract_title.trim(),
      contract_type: contractType,
      contract_status: contractStatus,
      start_date: input.start_date,
      end_date: input.end_date,
      salary_amount: input.salary_amount,
      salary_frequency: salaryFrequency,
      is_gratuity_eligible: input.is_gratuity_eligible,
      vacation_leave_days: vacationLeaveDays,
      sick_leave_days: sickLeaveDays,
    })
    .eq("id", input.id)
    .select(CONTRACT_LIST_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update contract: ${error.message}`);
  }
  await replaceContractAllowances(input.id, input.allowances ?? []);

  await upsertContractLeaveEntitlements({
    employee_id: employeeId,
    contract_id: input.id,
    contract_start_date: input.start_date,
    contract_end_date: input.end_date,
    vacation_leave_days: vacationLeaveDays,
    sick_leave_days: sickLeaveDays,
  });

  const [enriched] = await enrichContractsWithEmployeeNames([
    data as ContractDatabaseRow,
  ]);
  if (!enriched) {
    throw new Error("Contract was updated but could not be loaded.");
  }
  return enriched;
}

export async function generateContractLifecycleAlerts(): Promise<number> {
  const supabase = await createClient();
  const today = todayDateString();
  const in30Days = plusDaysDateString(30);

  const { data: expiring, error: expiringError } = await supabase
    .from("contracts")
    .select("id, employee_id, contract_number, end_date")
    .not("end_date", "is", null)
    .gte("end_date", today)
    .lte("end_date", in30Days);

  if (expiringError) {
    throw new Error(
      `Failed loading expiring contracts for alerts: ${expiringError.message}`
    );
  }

  const { data: overdue, error: overdueError } = await supabase
    .from("contracts")
    .select("id, employee_id, contract_number, renewal_due_date")
    .not("renewal_due_date", "is", null)
    .lt("renewal_due_date", today)
    .neq("renewal_status", "renewed");

  if (overdueError) {
    throw new Error(
      `Failed loading overdue renewals for alerts: ${overdueError.message}`
    );
  }

  const payload = [
    ...(expiring ?? []).map((row) => ({
      correlation_id: `contract-expiring-${row.id}`,
      alert_title: "Contract Expiring Soon",
      alert_message: `Contract ${
        row.contract_number ?? row.id
      } expires on ${row.end_date}.`,
      module_name: "Contracts",
      severity_level: "warning",
      status: "active",
      entity_type: "contract",
      entity_id: row.id,
      employee_id: row.employee_id,
      triggered_at: new Date().toISOString(),
    })),
    ...(overdue ?? []).map((row) => ({
      correlation_id: `contract-renewal-overdue-${row.id}`,
      alert_title: "Overdue Renewal",
      alert_message: `Contract ${
        row.contract_number ?? row.id
      } renewal overdue since ${row.renewal_due_date}.`,
      module_name: "Contracts",
      severity_level: "critical",
      status: "active",
      entity_type: "contract",
      entity_id: row.id,
      employee_id: row.employee_id,
      triggered_at: new Date().toISOString(),
    })),
  ];

  if (!payload.length) return 0;

  const { error: upsertError } = await supabase
    .from("alerts")
    .upsert(payload, { onConflict: "correlation_id" });

  if (upsertError) {
    throw new Error(
      `Failed upserting contract lifecycle alerts: ${upsertError.message}`
    );
  }

  return payload.length;
}