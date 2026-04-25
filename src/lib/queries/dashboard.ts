import { createClient } from "@/lib/supabase/server";
import { getEffectiveContractStatus } from "@/lib/queries/contracts";

export type DashboardMetrics = {
  activeEmployeesCount: number;
  totalEmployeesCount: number;
  activeContractsCount: number;
  contractsExpiringIn90DaysCount: number;
  expiredContractsCount: number;
  lowSickLeaveCount: number;
  lowVacationLeaveCount: number;
  employeesOnLeaveCount: number;
  pendingLeaveApprovalsCount: number;
  lowLeaveBalanceAlertsCount: number;
  filesCheckedOutCount: number;
  overdueFileReturnsCount: number;
  missingFilesCount: number;
  filesInTransitCount: number;
  activeAlertsCount: number;
  criticalAlertsCount: number;
};

export type DashboardMetricsScope = {
  workforce?: boolean;
  contracts?: boolean;
  leave?: boolean;
  files?: boolean;
  alerts?: boolean;
};

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function plusDaysDateString(days: number): string {
  const now = new Date();
  now.setDate(now.getDate() + days);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeLeaveType(value: string | null): string {
  const normalized = (value ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (!normalized) return "";
  return normalized.endsWith("_leave") ? normalized : `${normalized}_leave`;
}

async function countEmployeesByStatus(status: string): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("employees")
    .select("id", { head: true, count: "exact" })
    .eq("employment_status", status);

  if (error) {
    throw new Error(`Failed to count employees (${status}): ${error.message}`);
  }

  return count ?? 0;
}

async function countAllEmployees(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("employees")
    .select("id", { head: true, count: "exact" });

  if (error) {
    throw new Error(`Failed to count employees: ${error.message}`);
  }

  return count ?? 0;
}

async function countActiveContracts(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_status, end_date");

  if (error) {
    throw new Error(`Failed to count active contracts: ${error.message}`);
  }

  return (data ?? []).filter((contract) => getEffectiveContractStatus(contract) === "active").length;
}

async function countContractsExpiringIn90Days(): Promise<number> {
  const supabase = await createClient();
  const today = todayDateString();
  const in90Days = plusDaysDateString(90);

  const { data, error } = await supabase
    .from("contracts")
    .select("id, contract_status, end_date")
    .not("end_date", "is", null)
    .gte("end_date", today)
    .lte("end_date", in90Days);

  if (error) {
    throw new Error(`Failed to count expiring contracts: ${error.message}`);
  }

  return (data ?? []).filter((contract) => getEffectiveContractStatus(contract) === "active").length;
}

async function countExpiredContracts(): Promise<number> {
  const supabase = await createClient();
  const today = todayDateString();

  const { count, error } = await supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .not("end_date", "is", null)
    .lt("end_date", today);

  if (error) {
    throw new Error(`Failed to count expired contracts: ${error.message}`);
  }

  return count ?? 0;
}

async function countLowLeaveByType(leaveType: "sick_leave" | "vacation_leave"): Promise<number> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("leave_balances")
    .select("leave_type, remaining_days, warning_threshold_days, low_balance_warning_enabled")
    .neq("low_balance_warning_enabled", false);

  if (error) {
    throw new Error(`Failed to count low ${leaveType}: ${error.message}`);
  }

  return (data ?? []).filter((row) => {
    const remaining = Number(row.remaining_days ?? 0);
    const threshold = Number(row.warning_threshold_days ?? 0);
    return normalizeLeaveType(row.leave_type) === leaveType && remaining <= threshold;
  }).length;
}

async function countEmployeesOnLeave(): Promise<number> {
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

async function countPendingLeaveApprovals(): Promise<number> {
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

async function countLowLeaveBalanceAlerts(): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leave_balances")
    .select("remaining_days, warning_threshold_days, low_balance_warning_enabled")
    .neq("low_balance_warning_enabled", false);

  if (error) {
    throw new Error(`Failed to count low leave balance alerts: ${error.message}`);
  }

  return (data ?? []).filter((row) => {
    const remaining = Number(row.remaining_days ?? 0);
    const threshold = Number(row.warning_threshold_days ?? 0);
    return remaining <= threshold;
  }).length;
}

async function countFilesInTransit(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("file_movements")
    .select("id", { head: true, count: "exact" })
    .in("movement_status", ["transferred", "in_transit"]);

  if (error) {
    throw new Error(`Failed to count files in transit: ${error.message}`);
  }

  return count ?? 0;
}

async function countFilesByMovementStatus(statuses: string[]): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("file_movements")
    .select("id", { head: true, count: "exact" })
    .in("movement_status", statuses);

  if (error) {
    throw new Error(`Failed to count file movement statuses: ${error.message}`);
  }

  return count ?? 0;
}

async function countOverdueFileReturns(): Promise<number> {
  return 0;
}

async function countActiveAlerts(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("alerts")
    .select("id", { head: true, count: "exact" })
    .eq("status", "active");

  if (error) {
    throw new Error(`Failed to count active alerts: ${error.message}`);
  }

  return count ?? 0;
}

async function countCriticalAlerts(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("alerts")
    .select("id", { head: true, count: "exact" })
    .eq("status", "active")
    .eq("severity_level", "critical");

  if (error) {
    throw new Error(`Failed to count critical alerts: ${error.message}`);
  }

  return count ?? 0;
}

export async function getDashboardMetrics(scope: DashboardMetricsScope = {}): Promise<DashboardMetrics> {
  const {
    workforce = true,
    contracts = true,
    leave = true,
    files = true,
    alerts = true,
  } = scope;

  const [
    activeEmployeesCount,
    totalEmployeesCount,
    activeContractsCount,
    contractsExpiringIn90DaysCount,
    expiredContractsCount,
    lowSickLeaveCount,
    lowVacationLeaveCount,
    employeesOnLeaveCount,
    pendingLeaveApprovalsCount,
    lowLeaveBalanceAlertsCount,
    filesCheckedOutCount,
    overdueFileReturnsCount,
    missingFilesCount,
    filesInTransitCount,
    activeAlertsCount,
    criticalAlertsCount,
  ] = await Promise.all([
    workforce ? countEmployeesByStatus("active") : Promise.resolve(0),
    workforce ? countAllEmployees() : Promise.resolve(0),
    contracts ? countActiveContracts() : Promise.resolve(0),
    contracts ? countContractsExpiringIn90Days() : Promise.resolve(0),
    contracts ? countExpiredContracts() : Promise.resolve(0),
    leave ? countLowLeaveByType("sick_leave") : Promise.resolve(0),
    leave ? countLowLeaveByType("vacation_leave") : Promise.resolve(0),
    leave ? countEmployeesOnLeave() : Promise.resolve(0),
    leave ? countPendingLeaveApprovals() : Promise.resolve(0),
    leave ? countLowLeaveBalanceAlerts() : Promise.resolve(0),
    files ? countFilesByMovementStatus(["checked_out"]) : Promise.resolve(0),
    files ? countOverdueFileReturns() : Promise.resolve(0),
    files ? countFilesByMovementStatus(["missing"]) : Promise.resolve(0),
    files ? countFilesInTransit() : Promise.resolve(0),
    alerts ? countActiveAlerts() : Promise.resolve(0),
    alerts ? countCriticalAlerts() : Promise.resolve(0),
  ]);

  return {
    activeEmployeesCount,
    totalEmployeesCount,
    activeContractsCount,
    contractsExpiringIn90DaysCount,
    expiredContractsCount,
    lowSickLeaveCount,
    lowVacationLeaveCount,
    employeesOnLeaveCount,
    pendingLeaveApprovalsCount,
    lowLeaveBalanceAlertsCount,
    filesCheckedOutCount,
    overdueFileReturnsCount,
    missingFilesCount,
    filesInTransitCount,
    activeAlertsCount,
    criticalAlertsCount,
  };
}
