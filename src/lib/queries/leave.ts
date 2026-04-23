import { createClient } from "@/lib/supabase/server";

/** Default warning thresholds for low-balance views */
export const DEFAULT_LOW_SICK_THRESHOLD = 3;
export const DEFAULT_LOW_VACATION_THRESHOLD = 5;

/** Columns read from `public.leave_balances` (extend if your table has display fields). */
const LEAVE_BALANCE_SELECT = `
  id,
  employee_id,
  sick_leave_balance,
  vacation_leave_balance,
  casual_leave_balance,
  special_leave_balance,
  updated_at
`;

export type LeaveBalanceRecord = {
  id: string;
  employee_id: string;
  employee_name: string | null;
  department: string | null;
  sick_leave_balance: number;
  vacation_leave_balance: number;
  casual_leave_balance: number;
  special_leave_balance: number;
  updated_at: string | null;
};

type RawLeaveBalanceRow = {
  id: string;
  employee_id: string;
  sick_leave_balance: number | string | null;
  vacation_leave_balance: number | string | null;
  casual_leave_balance: number | string | null;
  special_leave_balance: number | string | null;
  updated_at: string | null;
};

function toNumber(value: number | string | null | undefined, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapLeaveBalanceRow(row: RawLeaveBalanceRow): LeaveBalanceRecord {
  return {
    id: row.id,
    employee_id: row.employee_id,
    employee_name: null,
    department: null,
    sick_leave_balance: toNumber(row.sick_leave_balance),
    vacation_leave_balance: toNumber(row.vacation_leave_balance),
    casual_leave_balance: toNumber(row.casual_leave_balance),
    special_leave_balance: toNumber(row.special_leave_balance),
    updated_at: row.updated_at,
  };
}

const LEAVE_TRANSACTION_SELECT = `
  id,
  employee_id,
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

export type LeaveTransactionRecord = {
  id: string;
  employee_id: string;
  employee_name: string | null;
  leave_type: string;
  transaction_type: string;
  start_date: string | null;
  end_date: string | null;
  days: string | number | null;
  reason: string | null;
  status: string | null;
  notes: string | null;
  medical_certificate_required: boolean | null;
  medical_certificate_received: boolean | null;
  return_to_work_date: string | null;
  created_at: string | null;
};

type RawLeaveTransactionRow = {
  id: string;
  employee_id: string;
  leave_type: string | null;
  transaction_type: string | null;
  start_date: string | null;
  end_date: string | null;
  days: string | number | null;
  reason: string | null;
  status: string | null;
  notes: string | null;
  medical_certificate_required: boolean | null;
  medical_certificate_received: boolean | null;
  return_to_work_date: string | null;
  created_at: string | null;
};

function mapLeaveTransactionRow(row: RawLeaveTransactionRow): LeaveTransactionRecord {
  return {
    id: row.id,
    employee_id: row.employee_id,
    employee_name: null,
    leave_type: row.leave_type ?? "",
    transaction_type: row.transaction_type ?? "",
    start_date: row.start_date,
    end_date: row.end_date,
    days: row.days,
    reason: row.reason,
    status: row.status,
    notes: row.notes,
    medical_certificate_required: row.medical_certificate_required,
    medical_certificate_received: row.medical_certificate_received,
    return_to_work_date: row.return_to_work_date,
    created_at: row.created_at,
  };
}

export type LeaveSearchParams = {
  query?: string;
};

/** Loads `public.leave_balances`. Name/department are null unless you extend the select + mapper. */
export async function listLeaveBalances(): Promise<LeaveBalanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_balances")
    .select(LEAVE_BALANCE_SELECT)
    .order("employee_id", { ascending: true });

  if (error) {
    throw new Error(`Failed to load leave balances: ${error.message}`);
  }

  return (data as RawLeaveBalanceRow[] | null)?.map(mapLeaveBalanceRow) ?? [];
}

export async function listLowSickLeave(threshold = DEFAULT_LOW_SICK_THRESHOLD): Promise<LeaveBalanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_balances")
    .select(LEAVE_BALANCE_SELECT)
    .lte("sick_leave_balance", threshold)
    .order("sick_leave_balance", { ascending: true });

  if (error) {
    throw new Error(`Failed to load low sick leave balances: ${error.message}`);
  }

  return (data as RawLeaveBalanceRow[] | null)?.map(mapLeaveBalanceRow) ?? [];
}

export async function listLowVacationLeave(threshold = DEFAULT_LOW_VACATION_THRESHOLD): Promise<LeaveBalanceRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_balances")
    .select(LEAVE_BALANCE_SELECT)
    .lte("vacation_leave_balance", threshold)
    .order("vacation_leave_balance", { ascending: true });

  if (error) {
    throw new Error(`Failed to load low vacation leave balances: ${error.message}`);
  }

  return (data as RawLeaveBalanceRow[] | null)?.map(mapLeaveBalanceRow) ?? [];
}

/** Loads `public.leave_transactions`. */
export async function listLeaveTransactions(params?: LeaveSearchParams): Promise<LeaveTransactionRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();

  let query = supabase.from("leave_transactions").select(LEAVE_TRANSACTION_SELECT).order("created_at", { ascending: false });

  if (queryText) {
    query = query.or(
      [
        `employee_id.ilike.%${queryText}%`,
        `leave_type.ilike.%${queryText}%`,
        `transaction_type.ilike.%${queryText}%`,
        `status.ilike.%${queryText}%`,
        `reason.ilike.%${queryText}%`,
        `notes.ilike.%${queryText}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load leave transactions: ${error.message}`);
  }

  return (data as RawLeaveTransactionRow[] | null)?.map(mapLeaveTransactionRow) ?? [];
}

export async function getLeaveTransactionById(id: string): Promise<LeaveTransactionRecord | null> {
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
  return mapLeaveTransactionRow(data as RawLeaveTransactionRow);
}
