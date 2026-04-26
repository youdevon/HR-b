import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth/permissions";
import { getAuditActivityReport, type ReportFilters } from "@/lib/queries/reports";

function clean(value?: string | null): string {
  return value?.trim() ?? "";
}

function getFilters(searchParams: URLSearchParams): ReportFilters {
  return {
    show: searchParams.get("show") ?? "",
    module: searchParams.get("module") ?? "",
    action: searchParams.get("action") ?? "",
    summary: searchParams.get("summary") ?? "",
    performedBy:
      searchParams.get("performedByUserId") ?? searchParams.get("performedBy") ?? "",
    performedForEmployeeId: searchParams.get("performedForEmployeeId") ?? "",
    startDate: searchParams.get("startDate") ?? "",
    endDate: searchParams.get("endDate") ?? "",
  };
}

function hasCriteria(filters: ReportFilters): boolean {
  return Boolean(
    clean(filters.show).toLowerCase() === "all" ||
      clean(filters.module) ||
      clean(filters.action) ||
      clean(filters.summary) ||
      clean(filters.performedBy) ||
      clean(filters.performedForEmployeeId) ||
      clean(filters.startDate) ||
      clean(filters.endDate)
  );
}

function toReadableLabel(value: string | null | undefined): string {
  const raw = clean(value);
  if (!raw) return "—";
  return raw
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function toReadableAction(value: string | null | undefined): string {
  const normalized = clean(value).toLowerCase();
  const map: Record<string, string> = {
    create: "Create",
    update: "Update",
    delete: "Delete",
    approve: "Approve",
    reject: "Reject",
    acknowledge: "Acknowledge",
    resolve: "Resolve",
    login: "Login",
    logout: "Logout",
  };
  if (map[normalized]) return map[normalized];
  const suffix = normalized.split("_").pop() ?? normalized;
  return map[suffix] ?? toReadableLabel(value);
}

function formatDate(value: string | null | undefined): string {
  const raw = clean(value);
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "—";
  return `${parsed.getFullYear()} ${parsed.toLocaleString(undefined, {
    month: "long",
  })} ${parsed.getDate()}`;
}

function formatTime(value: string | null | undefined): string {
  const raw = clean(value);
  if (!raw) return "—";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function filterSummary(filters: ReportFilters): string {
  const items: string[] = [];
  if (clean(filters.show).toLowerCase() === "all") items.push("Show: all");
  if (clean(filters.module)) items.push(`Module: ${filters.module}`);
  if (clean(filters.action)) items.push(`Action: ${filters.action}`);
  if (clean(filters.summary)) items.push(`Summary: ${filters.summary}`);
  if (clean(filters.performedBy)) items.push(`Performed By User ID: ${filters.performedBy}`);
  if (clean(filters.performedForEmployeeId)) {
    items.push(`Performed For Employee ID: ${filters.performedForEmployeeId}`);
  }
  if (clean(filters.startDate)) items.push(`Start Date: ${filters.startDate}`);
  if (clean(filters.endDate)) items.push(`End Date: ${filters.endDate}`);
  return items.length ? items.join(" | ") : "No filters";
}

export async function GET(request: Request) {
  if (!(await hasPermission("reports.export")) || !(await hasPermission("reports.audit.view"))) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const filters = getFilters(searchParams);
  if (!hasCriteria(filters)) {
    return NextResponse.json(
      { error: "Use Show All or apply filters before exporting." },
      { status: 400 }
    );
  }

  const rows = await getAuditActivityReport(filters);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Audit Activity");
  const now = new Date();

  sheet.columns = [
    { header: "Date", key: "date", width: 18 },
    { header: "Time", key: "time", width: 14 },
    { header: "Module", key: "module", width: 18 },
    { header: "Action", key: "action", width: 18 },
    { header: "Summary", key: "summary", width: 42 },
    { header: "Performed By", key: "performed_by", width: 24 },
    { header: "Performed For", key: "performed_for", width: 30 },
    { header: "IP Address", key: "ip_address", width: 20 },
    { header: "Computer / Device Name", key: "device_name", width: 30 },
  ];

  sheet.mergeCells("A1:I1");
  sheet.getCell("A1").value = "Audit Activity Report";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A2").value = `Generated: ${now.toLocaleString()}`;
  sheet.getCell("A3").value = `Filters: ${filterSummary(filters)}`;

  const headerRow = sheet.addRow([
    "Date",
    "Time",
    "Module",
    "Action",
    "Summary",
    "Performed By",
    "Performed For",
    "IP Address",
    "Computer / Device Name",
  ]);
  headerRow.font = { bold: true };

  for (const row of rows) {
    const when = row.event_timestamp ?? row.created_at;
    sheet.addRow({
      date: formatDate(when),
      time: formatTime(when),
      module: toReadableLabel(row.module_name),
      action: toReadableAction(row.action_type),
      summary: row.action_summary,
      performed_by: row.performed_by_display_name,
      performed_for: row.performed_for_display,
      ip_address: row.ip_address ?? "—",
      device_name: row.device_name ?? row.computer_name ?? row.user_agent ?? "—",
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="audit-report.xlsx"',
      "Cache-Control": "no-store",
    },
  });
}
