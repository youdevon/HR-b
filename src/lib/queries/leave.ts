import { createClient } from "@/lib/supabase/server";

export const LEAVE_TYPES = [
  "Vacation",
  "Sick",
  "Casual",
  "Maternity",
  "Paternity",
  "Unpaid",
  "Special",
] as const;

export type LeaveType = (typeof LEAVE_TYPES)[number];

export type LeaveAction =
  | "apply_leave"
  | "approve_leave"
  | "reject_leave"
  | "cancel_leave"
  | "return_from_leave";

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

function normalizeLeaveType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
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
  return_to_work_date?: string | null;
};

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
  const calculatedDays =
    input.total_days ??
    (input.start_date && input.end_date
      ? calculateDays(input.start_date, input.end_date)
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
      medical_certificate_received: false,
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

  const lowVacation = balances.filter((balance) => {
    const remaining = Number(balance.remaining_days ?? 0);
    const threshold = Number(balance.warning_threshold_days ?? 0);
    return (
      normalizeLeaveType(balance.leave_type ?? "") === "vacation_leave" &&
      balance.low_balance_warning_enabled !== false &&
      remaining <= threshold
    );
  });

  const excessiveSick = balances.filter((balance) => {
    const used = Number(balance.used_days ?? 0);
    const entitlement = Number(balance.entitlement_days ?? 0);
    return normalizeLeaveType(balance.leave_type ?? "") === "sick_leave" && entitlement > 0 && used > entitlement;
  });

  const outstandingApprovals = transactions.filter((transaction) => {
    return (
      transaction.approval_status === "pending" &&
      (transaction.created_at ?? today) <= approvalCutoff
    );
  });

  const payload = [
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
    ...excessiveSick.map((balance) => ({
      correlation_id: `leave-excessive-sick-${balance.id}`,
      alert_title: "Excessive Sick Leave",
      alert_message: `Sick leave used (${balance.used_days ?? 0}) exceeds entitlement (${balance.entitlement_days ?? 0}).`,
      module_name: "Leave",
      severity_level: "critical",
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