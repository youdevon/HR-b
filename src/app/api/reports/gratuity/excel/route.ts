import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getGratuityReportData, type ReportFilters } from "@/lib/queries/reports";

function clean(value?: string): string {
  return value?.trim() ?? "";
}

function getFilters(searchParams: URLSearchParams): ReportFilters {
  return {
    show: searchParams.get("show") ?? "",
    query: searchParams.get("query") ?? searchParams.get("q") ?? "",
    status: searchParams.get("status") ?? "",
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
  };
}

function hasCriteria(filters: ReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.status) ||
      clean(filters.startDate) ||
      clean(filters.endDate)
  );
}

function filterSummary(filters: ReportFilters): string {
  const items: string[] = [];
  if (clean(filters.show).toLowerCase() === "all") items.push("Show: all");
  if (clean(filters.query)) items.push(`Search: ${filters.query}`);
  if (clean(filters.status)) items.push(`Status: ${filters.status}`);
  if (clean(filters.startDate)) items.push(`Start Date: ${filters.startDate}`);
  if (clean(filters.endDate)) items.push(`End Date: ${filters.endDate}`);
  return items.length ? items.join(" | ") : "No filters";
}

function formatDate(value: string | null): Date | string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed;
}

function formatStatus(value: string): string {
  return value
    .replaceAll("_", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filters = getFilters(searchParams);
  if (!hasCriteria(filters)) {
    return NextResponse.json({ error: "Use Show All or apply filters before exporting." }, { status: 400 });
  }
  const report = await getGratuityReportData(filters);
  if (!report.generated) {
    return NextResponse.json({ error: "Generate a report before exporting." }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Gratuity Report");
  const now = new Date();

  sheet.columns = [
    { header: "Employee", key: "employee", width: 28 },
    { header: "File #", key: "file_number", width: 14 },
    { header: "Contract #", key: "contract_number", width: 18 },
    { header: "Status", key: "status", width: 18 },
    { header: "Calculation Date", key: "calculation_date", width: 18 },
    { header: "Approved Date", key: "approved_date", width: 18 },
    { header: "Service Start", key: "service_start", width: 16 },
    { header: "Service End", key: "service_end", width: 16 },
    { header: "Service Months", key: "service_months", width: 14 },
    { header: "Salary Basis", key: "salary_basis", width: 16 },
    { header: "Approved Amount", key: "approved_amount", width: 18 },
  ];

  sheet.mergeCells("A1:K1");
  sheet.getCell("A1").value = "Gratuity Report";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A2").value = `Generated: ${now.toLocaleString()}`;
  sheet.getCell("A3").value = `Filters: ${filterSummary(filters)}`;
  const headerRow = sheet.addRow([
    "Employee",
    "File #",
    "Contract #",
    "Status",
    "Calculation Date",
    "Approved Date",
    "Service Start",
    "Service End",
    "Service Months",
    "Salary Basis",
    "Approved Amount",
  ]);
  headerRow.font = { bold: true };

  for (const row of report.rows) {
    sheet.addRow({
      employee: row.employee_name,
      file_number: row.file_number ?? "—",
      contract_number: row.contract_number ?? "—",
      status: formatStatus(row.calculation_status),
      calculation_date: formatDate(row.calculation_date),
      approved_date: formatDate(row.approved_at),
      service_start: formatDate(row.service_start_date),
      service_end: formatDate(row.service_end_date),
      service_months: row.service_length_months ?? "—",
      salary_basis: row.salary_basis_amount ?? "—",
      approved_amount: row.approved_amount ?? "—",
    });
  }

  [5, 6, 7, 8].forEach((column) => {
    sheet.getColumn(column).numFmt = "mmm dd, yyyy";
  });
  [10, 11].forEach((column) => {
    sheet.getColumn(column).numFmt = '"$"#,##0.00';
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="gratuity-report.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
