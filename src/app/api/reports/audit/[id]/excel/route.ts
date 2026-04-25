import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { getAuditLogById } from "@/lib/queries/audit";

function clean(value?: string | null): string {
  return value?.trim() ?? "";
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

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function toDisplayValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function sectionHasData(rows: Array<[string, string]>): boolean {
  return rows.some(([, value]) => clean(value));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const record = await getAuditLogById(id);
  if (!record) {
    return NextResponse.json({ error: "Audit detail not found." }, { status: 404 });
  }

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Audit Detail");
  const now = new Date();
  const when = record.event_timestamp ?? record.created_at;

  sheet.columns = [
    { key: "a", width: 30 },
    { key: "b", width: 80 },
    { key: "c", width: 40 },
  ];
  sheet.getCell("A1").value = "Audit Detail Report";
  sheet.getCell("A1").font = { bold: true, size: 15 };
  sheet.getCell("A2").value = `Generated: ${now.toLocaleString()}`;
  sheet.getCell("A3").value = `Audit ID: ${record.id}`;

  let rowIndex = 5;
  const addSection = (title: string, entries: Array<[string, string]>) => {
    if (!sectionHasData(entries)) return;
    sheet.getCell(`A${rowIndex}`).value = title;
    sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 12 };
    rowIndex += 1;
    for (const [label, value] of entries) {
      if (!clean(value)) continue;
      sheet.getCell(`A${rowIndex}`).value = label;
      sheet.getCell(`A${rowIndex}`).font = { bold: true };
      sheet.getCell(`B${rowIndex}`).value = value;
      rowIndex += 1;
    }
    rowIndex += 1;
  };

  addSection("Audit Summary", [
    ["Date", formatDate(when)],
    ["Time", formatTime(when)],
    ["Module", toReadableLabel(record.module_name)],
    ["Action", toReadableAction(record.action_type)],
    ["Summary", record.action_summary ?? ""],
  ]);

  addSection("User and Device Information", [
    ["Performed By", record.performed_by_display_name],
    ["IP Address", record.ip_address ?? ""],
    ["Computer / Device Name", record.device_name ?? record.user_agent ?? ""],
  ]);

  addSection("Employee / Record Affected", [
    ["Performed For", record.performed_for_display],
    ["Entity Type", record.entity_type],
    ["Entity ID", record.entity_id],
  ]);

  addSection("Changed Fields", [
    [
      "Changed Fields",
      (record.changed_fields ?? []).length ? (record.changed_fields ?? []).join(", ") : "",
    ],
  ]);

  addSection("Reason for Change", [["Reason for Change", record.reason_for_change ?? ""]]);

  const oldObject = toObject(record.old_values);
  const newObject = toObject(record.new_values);
  const fields = Array.from(
    new Set([...(record.changed_fields ?? []), ...Object.keys(oldObject), ...Object.keys(newObject)])
  ).filter((field) => {
    const oldValue = toDisplayValue(oldObject[field]);
    const newValue = toDisplayValue(newObject[field]);
    return oldValue !== newValue || (record.changed_fields ?? []).includes(field);
  });

  if (fields.length > 0) {
    sheet.getCell(`A${rowIndex}`).value = "Before and After Values";
    sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 12 };
    rowIndex += 1;
    sheet.getCell(`A${rowIndex}`).value = "Field";
    sheet.getCell(`B${rowIndex}`).value = "Previous Value";
    sheet.getCell(`C${rowIndex}`).value = "New Value";
    sheet.getRow(rowIndex).font = { bold: true };
    rowIndex += 1;
    for (const field of fields) {
      const oldValue = toDisplayValue(oldObject[field]);
      const newValue = toDisplayValue(newObject[field]);
      if (!clean(oldValue) && !clean(newValue)) continue;
      sheet.getCell(`A${rowIndex}`).value = field;
      sheet.getCell(`B${rowIndex}`).value = oldValue || "—";
      sheet.getCell(`C${rowIndex}`).value = newValue || "—";
      rowIndex += 1;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="audit-detail-${id.slice(0, 8)}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
