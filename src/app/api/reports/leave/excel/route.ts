import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getLeaveReportData, type ReportFilters } from "@/lib/queries/reports";

function clean(value?: string): string {
  return value?.trim() ?? "";
}

function getFilters(searchParams: URLSearchParams): ReportFilters {
  return {
    show: searchParams.get("show") ?? "",
    query: searchParams.get("query") ?? searchParams.get("q") ?? "",
    leaveType: searchParams.get("leaveType") ?? "",
    status: searchParams.get("status") ?? "",
    activeAsAtDate: searchParams.get("activeAsAtDate") ?? "",
    effectiveFrom: searchParams.get("effectiveFrom") ?? searchParams.get("startDate") ?? "",
    effectiveTo: searchParams.get("effectiveTo") ?? searchParams.get("endDate") ?? "",
    contractYear: searchParams.get("contractYear") ?? "",
    specificEmployeeLookup: searchParams.get("specificEmployeeLookup") ?? "",
    specificEmployeeId: searchParams.get("specificEmployeeId") ?? "",
    contractId: searchParams.get("contractId") ?? "",
  };
}

function hasCriteria(filters: ReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.leaveType) ||
      clean(filters.status) ||
      clean(filters.activeAsAtDate) ||
      clean(filters.effectiveFrom) ||
      clean(filters.effectiveTo) ||
      clean(filters.contractYear) ||
      clean(filters.specificEmployeeLookup) ||
      clean(filters.specificEmployeeId) ||
      clean(filters.contractId)
  );
}

function filterSummary(filters: ReportFilters): string {
  const items: string[] = [];
  if (clean(filters.show).toLowerCase() === "all") items.push("Show: all");
  if (clean(filters.query)) items.push(`Employee Name or File Number: ${filters.query}`);
  if (clean(filters.leaveType)) items.push(`Leave Type: ${filters.leaveType}`);
  if (clean(filters.status)) items.push(`Status: ${filters.status}`);
  if (clean(filters.activeAsAtDate)) items.push(`Active As At Date: ${filters.activeAsAtDate}`);
  if (clean(filters.effectiveFrom)) items.push(`Effective From: ${filters.effectiveFrom}`);
  if (clean(filters.effectiveTo)) items.push(`Effective To: ${filters.effectiveTo}`);
  if (clean(filters.contractYear)) items.push(`Contract Year: ${filters.contractYear}`);
  if (clean(filters.specificEmployeeLookup)) {
    items.push(`Specific Employee Search: ${filters.specificEmployeeLookup}`);
  }
  if (clean(filters.specificEmployeeId)) items.push(`Specific Employee ID: ${filters.specificEmployeeId}`);
  if (clean(filters.contractId)) items.push(`Contract ID: ${filters.contractId}`);
  return items.length ? items.join(" | ") : "No filters";
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLeavePeriod(from: string | null, to: string | null): string {
  return `${formatDate(from)} to ${formatDate(to)}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = getFilters(searchParams);
  if (!hasCriteria(filters)) {
    return NextResponse.json(
      { error: "Use Show All or apply filters before exporting." },
      { status: 400 }
    );
  }
  const report = await getLeaveReportData(filters);
  const rows = report.rows;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Leave Report");
  const now = new Date();

  sheet.columns = [
    { header: "Employee Name", key: "employee_name", width: 28 },
    { header: "File #", key: "file_number", width: 14 },
    { header: "Contract Year", key: "contract_year", width: 14 },
    { header: "Leave Period", key: "leave_period", width: 30 },
    { header: "Leave Type", key: "leave_type", width: 20 },
    { header: "Entitlement", key: "entitlement", width: 14 },
    { header: "Used", key: "used", width: 12 },
    { header: "Remaining", key: "remaining", width: 12 },
    { header: "Status", key: "status", width: 12 },
  ];

  sheet.mergeCells("A1:J1");
  sheet.getCell("A1").value = "Leave Report";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A2").value = `Generated: ${now.toLocaleString()}`;
  sheet.getCell("A3").value = `Filters: ${filterSummary(filters)}`;
  sheet.getCell("A4").value =
    "Each row represents a leave balance for a specific contract year and leave type. Employees may appear more than once when they have sick and vacation leave across multiple contract years.";
  sheet.getCell("A5").value =
    "Sick leave resets each contract year. Vacation leave is shown by contract-year period for planning and monitoring.";

  const headerRow = sheet.addRow([
    "Employee Name",
    "File #",
    "Contract Year",
    "Leave Period",
    "Leave Type",
    "Entitlement",
    "Used",
    "Remaining",
    "Status",
  ]);
  headerRow.font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      employee_name: row.employee_name,
      file_number: row.file_number ?? "—",
      contract_year: row.contract_year_display,
      leave_period: formatLeavePeriod(row.effective_from, row.effective_to),
      leave_type: row.leave_type_label,
      entitlement: row.entitlement_days ?? 0,
      used: row.used_days ?? 0,
      remaining: row.remaining_days ?? 0,
      status: row.status === "active" ? "Active" : "Inactive",
    });
  }

  if (report.selectedEmployee && report.selectedContract) {
    const summaryStart = sheet.lastRow ? sheet.lastRow.number + 2 : 8;
    sheet.getCell(`A${summaryStart}`).value = "Specific Employee Contract Leave Detail";
    sheet.getCell(`A${summaryStart}`).font = { bold: true, size: 12 };
    sheet.getCell(`A${summaryStart + 1}`).value = `Employee Name: ${report.selectedEmployee.employee_name}`;
    sheet.getCell(`A${summaryStart + 2}`).value = `File #: ${report.selectedEmployee.file_number ?? "—"}`;
    sheet.getCell(`A${summaryStart + 3}`).value = `Department: ${report.selectedEmployee.department ?? "—"}`;
    sheet.getCell(`A${summaryStart + 4}`).value = `Job Title: ${report.selectedEmployee.job_title ?? "—"}`;
    sheet.getCell(`A${summaryStart + 5}`).value = `Contract Number: ${report.selectedContract.contract_number ?? "—"}`;
    sheet.getCell(`A${summaryStart + 6}`).value = `Contract Type: ${report.selectedContract.contract_type ?? "—"}`;
    sheet.getCell(`A${summaryStart + 7}`).value = `Start Date: ${formatDate(report.selectedContract.start_date)}`;
    sheet.getCell(`A${summaryStart + 8}`).value = `End Date: ${formatDate(report.selectedContract.end_date)}`;
    sheet.getCell(`A${summaryStart + 9}`).value = `Contract Status: ${report.selectedContract.contract_status ?? "—"}`;

    const detailHeaderRow = sheet.addRow([
      "Contract Year",
      "Effective From",
      "Effective To",
      "Leave Type",
      "Entitlement",
      "Used",
      "Remaining",
      "Leave Taken Dates",
      "Number of Leave Transactions",
    ]);
    detailHeaderRow.font = { bold: true };
    for (const detail of report.contractYearDetails) {
      sheet.addRow([
        detail.contract_year ?? "—",
        formatDate(detail.effective_from),
        formatDate(detail.effective_to),
        detail.leave_type_label,
        detail.entitlement_days ?? 0,
        detail.used_days ?? 0,
        detail.remaining_days ?? 0,
        detail.leave_taken_dates,
        detail.transaction_count,
      ]);
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as BodyInit, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="leave-report.xlsx"',
    },
  });
}
