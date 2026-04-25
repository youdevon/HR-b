import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getUserAccountsReport, type ReportFilters } from "@/lib/queries/reports";

function clean(value?: string | null): string {
  return value?.trim() ?? "";
}

function getFilters(searchParams: URLSearchParams): ReportFilters {
  return {
    show: searchParams.get("show") ?? "",
    query: searchParams.get("query") ?? searchParams.get("q") ?? "",
    roleId: searchParams.get("roleId") ?? "",
    status: searchParams.get("status") ?? "",
    createdYear: searchParams.get("createdYear") ?? "",
    createdMonth: searchParams.get("createdMonth") ?? "",
  };
}

function hasCriteria(filters: ReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.query) ||
      clean(filters.roleId) ||
      clean(filters.status) ||
      clean(filters.createdYear) ||
      clean(filters.createdMonth)
  );
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function filterSummary(filters: ReportFilters): string {
  const items: string[] = [];
  if (clean(filters.show).toLowerCase() === "all") items.push("Show: all");
  if (clean(filters.query)) items.push(`Search: ${filters.query}`);
  if (clean(filters.roleId)) items.push(`Role ID: ${filters.roleId}`);
  if (clean(filters.status)) items.push(`Status: ${filters.status}`);
  if (clean(filters.createdYear)) items.push(`Created Year: ${filters.createdYear}`);
  if (clean(filters.createdMonth)) items.push(`Created Month: ${filters.createdMonth}`);
  return items.length ? items.join(" | ") : "No filters";
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

  const { generated, rows } = await getUserAccountsReport(filters);
  if (!generated) {
    return NextResponse.json(
      { error: "Use Show All or apply filters before exporting." },
      { status: 400 }
    );
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Users Report");
  const now = new Date();

  sheet.columns = [
    { header: "Name", key: "name", width: 24 },
    { header: "Email", key: "email", width: 28 },
    { header: "Role", key: "role", width: 24 },
    { header: "Status", key: "status", width: 14 },
    { header: "Active", key: "active", width: 12 },
    { header: "Created Date", key: "created_date", width: 18 },
    { header: "Created By", key: "created_by", width: 24 },
    { header: "Last Updated Date", key: "updated_date", width: 18 },
  ];

  sheet.mergeCells("A1:H1");
  sheet.getCell("A1").value = "User Accounts Report";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A2").value = `Generated: ${now.toLocaleString()}`;
  sheet.getCell("A3").value = `Filters: ${filterSummary(filters)}`;

  const headerRow = sheet.addRow([
    "Name",
    "Email",
    "Role",
    "Status",
    "Active",
    "Created Date",
    "Created By",
    "Last Updated Date",
  ]);
  headerRow.font = { bold: true };

  for (const row of rows) {
    sheet.addRow({
      name: row.name,
      email: row.email ?? "—",
      role: row.role_name ?? "—",
      status: row.status,
      active: row.active === null ? "—" : row.active ? "Yes" : "No",
      created_date: formatDate(row.created_at),
      created_by: row.created_by_display,
      updated_date: formatDate(row.updated_at),
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="users-report.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
