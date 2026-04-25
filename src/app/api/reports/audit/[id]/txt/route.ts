import { NextResponse } from "next/server";
import { getAuditLogById } from "@/lib/queries/audit";

function clean(value?: string | null): string {
  return value?.trim() ?? "";
}

function toReadableLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .replaceAll("-", " ")
    .split(" ")
    .filter(Boolean)
    .map((part) => `${part[0]?.toUpperCase() ?? ""}${part.slice(1).toLowerCase()}`)
    .join(" ");
}

function toReadableAction(value?: string | null): string {
  const normalized = clean(value).toLowerCase();
  if (!normalized) return "Not recorded";
  const suffix = normalized.split("_").pop() ?? normalized;
  return toReadableLabel(suffix);
}

function formatDate(value?: string | null): string {
  const raw = clean(value);
  if (!raw) return "Not recorded";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";
  return `${parsed.getFullYear()} ${parsed.toLocaleString(undefined, { month: "long" })} ${parsed.getDate()}`;
}

function formatTime(value?: string | null): string {
  const raw = clean(value);
  if (!raw) return "Not recorded";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";
  return parsed.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Not recorded";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string" || typeof value === "number") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function toObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function section(title: string, lines: string[]): string {
  const nonEmpty = lines.filter((line) => clean(line));
  if (!nonEmpty.length) return "";
  return `${title}\n${"-".repeat(title.length)}\n${nonEmpty.join("\n")}\n\n`;
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

  const when = record.event_timestamp ?? record.created_at;
  const oldObject = toObject(record.old_values);
  const newObject = toObject(record.new_values);
  const changedFields = Array.from(
    new Set([...(record.changed_fields ?? []), ...Object.keys(oldObject), ...Object.keys(newObject)])
  ).filter((field) => {
    return JSON.stringify(oldObject[field]) !== JSON.stringify(newObject[field]) || (record.changed_fields ?? []).includes(field);
  });

  const beforeAfterLines = changedFields.map((field) => {
    const label = toReadableLabel(field);
    return [
      `* ${label}`,
      `  Previous: ${formatValue(oldObject[field])}`,
      `  New: ${formatValue(newObject[field])}`,
    ].join("\n");
  });

  const content = [
    "Audit Detail Report",
    "===================",
    `Generated: ${new Date().toLocaleString()}`,
    "",
    section("Audit Summary", [
      `Date: ${formatDate(when)}`,
      `Time: ${formatTime(when)}`,
      `Module: ${toReadableLabel(record.module_name)}`,
      `Action: ${toReadableAction(record.action_type)}`,
      `Summary: ${formatValue(record.action_summary)}`,
    ]),
    section("Performed By", [
      `Name: ${formatValue(record.performed_by_display_name)}`,
      `Role: ${formatValue(record.role_at_time)}`,
      `Email: ${formatValue(record.performed_by_email)}`,
    ]),
    section("Performed For", [
      `Employee Name: ${formatValue(record.related_employee_name)}`,
      `File Number: ${formatValue(record.related_employee_file_number)}`,
      `Department: ${formatValue(record.related_employee_department)}`,
      `Job Title: ${formatValue(record.related_employee_job_title)}`,
      `Context: ${formatValue(record.performed_for_display)}`,
    ]),
    section("Device and Network Information", [
      `IP Address: ${formatValue(record.ip_address)}`,
      `Computer / Device Name: ${formatValue(record.device_name)}`,
      `User Agent: ${formatValue(record.user_agent)}`,
    ]),
    section("Record Information", [
      `Entity Type: ${formatValue(record.entity_type)}`,
      `Entity ID: ${formatValue(record.entity_id)}`,
      `Related Module: ${toReadableLabel(record.module_name)}`,
    ]),
    section("Changes Made", [
      `Changed Fields: ${changedFields.length ? changedFields.map(toReadableLabel).join(", ") : "Not recorded"}`,
      ...(beforeAfterLines.length ? ["", ...beforeAfterLines] : []),
    ]),
    section("Reason / Notes", [
      `Reason for Change: ${formatValue(record.reason_for_change)}`,
    ]),
  ]
    .filter(Boolean)
    .join("");

  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="audit-detail-${id.slice(0, 8)}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}
