import { createClient } from "@/lib/supabase/server";

export type LeaveBalanceRecord = {
  id: string;
  employee_id: string | null;
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

export async function listLeaveTransactions(): Promise<LeaveTransactionRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_transactions")
    .select(LEAVE_TRANSACTION_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listLeaveTransactions error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load leave transactions: ${error.message}`);
  }

  return data ?? [];
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

  return data ?? [];
}

export async function listLowSickLeave(): Promise<LeaveBalanceRecord[]> {
  const balances = await listLeaveBalances();

  return balances
    .filter((row) => {
      const remaining = Number(row.remaining_days ?? 0);
      const threshold = Number(row.warning_threshold_days ?? 0);

      return (
        row.leave_type === "sick_leave" &&
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
        row.leave_type === "vacation_leave" &&
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
        row.leave_type === "sick_leave" &&
        row.exhausted_warning_enabled !== false &&
        remaining <= 0
      );
    })
    .sort(
      (a, b) =>
        Number(a.remaining_days ?? 0) - Number(b.remaining_days ?? 0)
    );
}