import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth/permissions";
import { getPhysicalFileMovementsReport, type ReportFilters } from "@/lib/queries/reports";

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
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed;
}

export async function GET(request: Request) {
  if (!(await hasPermission("reports.export")) || !(await hasPermission("reports.files.view"))) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const filters = getFilters(searchParams);
  if (!hasCriteria(filters)) {
    return NextResponse.json({ error: "Use Show All or apply filters before exporting." }, { status: 400 });
  }

  const rows = await getPhysicalFileMovementsReport(filters);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Physical File Report");
  const now = new Date();

  sheet.columns = [
    { header: "Employee", key: "employee", width: 28 },
    { header: "File #", key: "file_number", width: 14 },
    { header: "From", key: "from_location", width: 24 },
    { header: "To", key: "to_location", width: 24 },
    { header: "Holder", key: "holder", width: 24 },
    { header: "Status", key: "status", width: 18 },
    { header: "Sent Date", key: "sent_date", width: 16 },
  ];

  sheet.mergeCells("A1:G1");
  sheet.getCell("A1").value = "Physical File Report";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A2").value = `Generated: ${now.toLocaleString()}`;
  sheet.getCell("A3").value = `Filters: ${filterSummary(filters)}`;
  const headerRow = sheet.addRow(["Employee", "File #", "From", "To", "Holder", "Status", "Sent Date"]);
  headerRow.font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      employee: row.employee_name ?? row.employee_number ?? "—",
      file_number: row.file_number ?? "—",
      from_location: row.from_location ?? "—",
      to_location: row.to_location ?? "—",
      holder: row.current_holder ?? "—",
      status: row.movement_status ?? "—",
      sent_date: formatDate(row.date_sent),
    });
  }
  sheet.getColumn(7).numFmt = "mmm dd, yyyy";

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="physical-file-report.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
