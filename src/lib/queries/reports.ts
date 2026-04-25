import { listUsers } from "@/lib/queries/admin";
import { listRecentAuditLogs } from "@/lib/queries/audit";
import { listContracts } from "@/lib/queries/contracts";
import { listDocuments } from "@/lib/queries/documents";
import { listEmployees } from "@/lib/queries/employees";
import { listFileMovements } from "@/lib/queries/file-movements";
import { listLeaveBalances, listLeaveTransactions } from "@/lib/queries/leave";

export type ReportFilters = {
  query?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  status?: string;
  contractStatus?: string;
  documentStatus?: string;
  leaveType?: string;
  reportType?: string;
};

function clean(value?: string): string {
  return value?.trim() ?? "";
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

function inDateRange(value: string | null | undefined, filters: ReportFilters): boolean {
  if (!value) return !filters.startDate && !filters.endDate;
  const date = value.slice(0, 10);
  return (!filters.startDate || date >= filters.startDate) && (!filters.endDate || date <= filters.endDate);
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
  const today = todayDateString();
  const in30Days = plusDaysDateString(30);

  return rows.filter((row) => {
    const type = clean(filters.reportType);
    const typeMatch =
      !type ||
      (type === "active" && row.contract_status === "active") ||
      (type === "expiring" && Boolean(row.end_date && row.end_date >= today && row.end_date <= in30Days)) ||
      (type === "expired" && Boolean(row.end_date && row.end_date < today));

    return (
      typeMatch &&
      matches(row.department, filters.department) &&
      matches(row.contract_status, filters.contractStatus || filters.status) &&
      inDateRange(row.start_date ?? row.created_at, filters)
    );
  });
}

export async function getLeaveBalancesReport(filters: ReportFilters) {
  const rows = await listLeaveBalances();
  return rows.filter(
    (row) =>
      matches(row.leave_type, filters.leaveType) &&
      inDateRange(row.effective_from ?? row.created_at, filters)
  );
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

export async function getDocumentExpiryReport(filters: ReportFilters) {
  const rows = await listDocuments({ query: filters.query });
  return rows.filter(
    (row) =>
      matches(row.document_status, filters.documentStatus || filters.status) &&
      inDateRange(row.expiry_date ?? row.uploaded_at, filters)
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
  const rows = await listRecentAuditLogs(250);
  return rows.filter(
    (row) =>
      includes(row.action_summary, filters.query) &&
      matches(row.module_name, filters.status) &&
      inDateRange(row.event_timestamp ?? row.created_at, filters)
  );
}

export async function getUserAccountsReport(filters: ReportFilters) {
  const rows = await listUsers();
  return rows.filter((row) => {
    const fullName = [row.first_name, row.last_name].filter(Boolean).join(" ");
    return (
      (includes(fullName, filters.query) || includes(row.email, filters.query)) &&
      matches(row.account_status, filters.status) &&
      inDateRange(row.created_at, filters)
    );
  });
}
