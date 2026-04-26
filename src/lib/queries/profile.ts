import { createClient } from "@/lib/supabase/server";
import type { EmployeeRecord } from "@/lib/queries/employees";
import type { ContractRecord } from "@/lib/queries/contracts";
import type { LeaveBalanceRecord, LeaveTransactionRecord } from "@/lib/queries/leave";

const EMPLOYEE_DETAIL_SELECT = `
  id,
  employee_number,
  file_number,
  first_name,
  middle_name,
  last_name,
  preferred_name,
  date_of_birth,
  department,
  division,
  job_title,
  employment_status,
  employment_type,
  hire_date,
  id_type,
  id_number,
  other_id_description,
  bir_number,
  work_email,
  personal_email,
  mobile_number,
  file_status,
  file_location,
  file_notes,
  created_at
`;

const CONTRACT_SELECT = `
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

const LEAVE_BALANCE_SELECT = `
  id,
  employee_id,
  contract_id,
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

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function getEffectiveContractStatus(contract: {
  contract_status?: string | null;
  end_date?: string | null;
}): string {
  const today = todayDateString();
  const endDate = (contract.end_date ?? "").trim();
  if (endDate && endDate < today) return "expired";
  const status = (contract.contract_status ?? "").trim().toLowerCase();
  return status || "inactive";
}

/**
 * Find the employee record linked by employee_id (FK) on user_profiles.
 */
export async function getEmployeeById(
  employeeId: string | null | undefined
): Promise<EmployeeRecord | null> {
  if (!employeeId) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_DETAIL_SELECT)
    .eq("id", employeeId)
    .maybeSingle();

  if (error) {
    console.error("getEmployeeById error:", error.message);
    return null;
  }

  return (data as EmployeeRecord | null) ?? null;
}

/**
 * Fallback: find the employee via email matching.
 * Matches against employees.work_email or personal_email.
 */
export async function getEmployeeByEmail(
  userEmail: string | null | undefined
): Promise<EmployeeRecord | null> {
  const email = (userEmail ?? "").trim().toLowerCase();
  if (!email) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_DETAIL_SELECT)
    .or(`work_email.ilike.${email},personal_email.ilike.${email}`)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getEmployeeByEmail error:", error.message);
    return null;
  }

  return (data as EmployeeRecord | null) ?? null;
}

/**
 * Resolve the linked employee: prefer employee_id FK, fall back to email.
 */
export async function getLinkedEmployeeForUser(
  employeeId: string | null | undefined,
  userEmail: string | null | undefined
): Promise<EmployeeRecord | null> {
  const byId = await getEmployeeById(employeeId);
  if (byId) return byId;
  return getEmployeeByEmail(userEmail);
}

export async function getProfileContracts(
  employeeId: string
): Promise<ContractRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_SELECT)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getProfileContracts error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    employee_name: null,
    employee_first_name: null,
    employee_last_name: null,
    employee_number: null,
    effective_contract_status: getEffectiveContractStatus(row),
  })) as ContractRecord[];
}

export async function getProfileLeaveBalances(
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
    console.error("getProfileLeaveBalances error:", error.message);
    return [];
  }

  return (data ?? []) as LeaveBalanceRecord[];
}

export async function getProfileLeaveTransactions(
  employeeId: string
): Promise<LeaveTransactionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_transactions")
    .select(LEAVE_TRANSACTION_SELECT)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getProfileLeaveTransactions error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    ...row,
    employee_name: null,
    employee_first_name: null,
    employee_last_name: null,
    employee_number: null,
    total_days: row.days,
    entitlement_days: null,
    days_taken: null,
    balance_days: null,
    approval_status: row.status,
    approved_by: null,
    approval_date: null,
    rejection_reason: null,
    leave_balance_id: row.leave_balance_id ?? null,
  })) as LeaveTransactionRecord[];
}

export type SelfServiceProfileData = {
  employee: EmployeeRecord | null;
  contracts: ContractRecord[];
  leaveBalances: LeaveBalanceRecord[];
  leaveTransactions: LeaveTransactionRecord[];
};

export async function loadSelfServiceProfile(
  employeeId: string | null | undefined,
  userEmail: string | null | undefined
): Promise<SelfServiceProfileData> {
  const employee = await getLinkedEmployeeForUser(employeeId, userEmail);
  if (!employee) {
    return { employee: null, contracts: [], leaveBalances: [], leaveTransactions: [] };
  }

  const [contracts, leaveBalances, leaveTransactions] = await Promise.all([
    getProfileContracts(employee.id),
    getProfileLeaveBalances(employee.id),
    getProfileLeaveTransactions(employee.id),
  ]);

  return { employee, contracts, leaveBalances, leaveTransactions };
}
