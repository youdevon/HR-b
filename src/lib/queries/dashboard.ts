import { createClient } from "@/lib/supabase/server";

export type DashboardMetrics = {
  activeEmployeesCount: number;
  totalEmployeesCount: number;
  activeContractsCount: number;
  contractsExpiringIn30DaysCount: number;
  expiredContractsCount: number;
  lowSickLeaveCount: number;
  lowVacationLeaveCount: number;
  documentsExpiringIn30DaysCount: number;
  filesInTransitCount: number;
  activeAlertsCount: number;
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
  const { count, error } = await supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .eq("contract_status", "active");

  if (error) {
    throw new Error(`Failed to count active contracts: ${error.message}`);
  }

  return count ?? 0;
}

async function countContractsExpiringIn30Days(): Promise<number> {
  const supabase = await createClient();
  const today = todayDateString();
  const in30Days = plusDaysDateString(30);

  const { count, error } = await supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .not("end_date", "is", null)
    .gte("end_date", today)
    .lte("end_date", in30Days);

  if (error) {
    throw new Error(`Failed to count expiring contracts: ${error.message}`);
  }

  return count ?? 0;
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
    .select("remaining_days, warning_threshold_days, low_balance_warning_enabled")
    .eq("leave_type", leaveType)
    .neq("low_balance_warning_enabled", false);

  if (error) {
    throw new Error(`Failed to count low ${leaveType}: ${error.message}`);
  }

  return (data ?? []).filter((row) => {
    const remaining = Number(row.remaining_days ?? 0);
    const threshold = Number(row.warning_threshold_days ?? 0);
    return remaining <= threshold;
  }).length;
}

async function countDocumentsExpiringIn30Days(): Promise<number> {
  const supabase = await createClient();
  const today = todayDateString();
  const in30Days = plusDaysDateString(30);

  const { count, error } = await supabase
    .from("documents")
    .select("id", { head: true, count: "exact" })
    .not("expiry_date", "is", null)
    .gte("expiry_date", today)
    .lte("expiry_date", in30Days);

  if (error) {
    throw new Error(`Failed to count expiring documents: ${error.message}`);
  }

  return count ?? 0;
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

async function countActiveAlerts(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("alerts")
    .select("id", { head: true, count: "exact" })
    .in("status", ["active", "acknowledged"]);

  if (error) {
    throw new Error(`Failed to count active alerts: ${error.message}`);
  }

  return count ?? 0;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [
    activeEmployeesCount,
    totalEmployeesCount,
    activeContractsCount,
    contractsExpiringIn30DaysCount,
    expiredContractsCount,
    lowSickLeaveCount,
    lowVacationLeaveCount,
    documentsExpiringIn30DaysCount,
    filesInTransitCount,
    activeAlertsCount,
  ] = await Promise.all([
    countEmployeesByStatus("active"),
    countAllEmployees(),
    countActiveContracts(),
    countContractsExpiringIn30Days(),
    countExpiredContracts(),
    countLowLeaveByType("sick_leave"),
    countLowLeaveByType("vacation_leave"),
    countDocumentsExpiringIn30Days(),
    countFilesInTransit(),
    countActiveAlerts(),
  ]);

  return {
    activeEmployeesCount,
    totalEmployeesCount,
    activeContractsCount,
    contractsExpiringIn30DaysCount,
    expiredContractsCount,
    lowSickLeaveCount,
    lowVacationLeaveCount,
    documentsExpiringIn30DaysCount,
    filesInTransitCount,
    activeAlertsCount,
  };
}
