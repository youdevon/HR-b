import { createClient } from "@/lib/supabase/server";
import { getEffectiveContractStatus } from "@/lib/queries/contracts";
import { listLowSickLeave, listLowVacationLeave } from "@/lib/queries/leave";

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
  filesCheckedOutCount: number;
  overdueFileReturnsCount: number;
  missingFilesCount: number;
  filesInTransitCount: number;
  pendingGratuityCalculationsCount: number;
  approvedUnpaidGratuityCount: number;
};

export type DashboardMetricsScope = {
  workforce?: boolean;
  contracts?: boolean;
  leave?: boolean;
  files?: boolean;
  gratuity?: boolean;
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
  if (leaveType === "vacation_leave") {
    const rows = await listLowVacationLeave();
    return rows.length;
  }
  const rows = await listLowSickLeave();
  return rows.length;
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

async function countPendingGratuityCalculations(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("gratuity_calculations")
    .select("id", { head: true, count: "exact" })
    .in("calculation_status", ["calculated", "under_review"]);

  if (error) {
    throw new Error(`Failed to count pending gratuity calculations: ${error.message}`);
  }

  return count ?? 0;
}

async function countApprovedUnpaidGratuity(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("gratuity_calculations")
    .select("id", { head: true, count: "exact" })
    .in("calculation_status", ["approved", "overridden"])
    .not("approved_amount", "is", null);

  if (error) {
    throw new Error(`Failed to count approved unpaid gratuity: ${error.message}`);
  }

  return count ?? 0;
}

export async function getDashboardMetrics(scope: DashboardMetricsScope = {}): Promise<DashboardMetrics> {
  const {
    workforce = true,
    contracts = true,
    leave = true,
    files = true,
    gratuity = true,
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
    filesCheckedOutCount,
    overdueFileReturnsCount,
    missingFilesCount,
    filesInTransitCount,
    pendingGratuityCalculationsCount,
    approvedUnpaidGratuityCount,
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
    files ? countFilesByMovementStatus(["checked_out"]) : Promise.resolve(0),
    files ? countOverdueFileReturns() : Promise.resolve(0),
    files ? countFilesByMovementStatus(["missing"]) : Promise.resolve(0),
    files ? countFilesInTransit() : Promise.resolve(0),
    gratuity ? countPendingGratuityCalculations() : Promise.resolve(0),
    gratuity ? countApprovedUnpaidGratuity() : Promise.resolve(0),
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
    filesCheckedOutCount,
    overdueFileReturnsCount,
    missingFilesCount,
    filesInTransitCount,
    pendingGratuityCalculationsCount,
    approvedUnpaidGratuityCount,
  };
}
