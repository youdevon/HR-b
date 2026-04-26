import { NextResponse } from "next/server";
import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { hasPermission } from "@/lib/auth/permissions";
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

function addSection(
  children: (Paragraph | Table)[],
  title: string,
  entries: Array<[string, string]>
) {
  const nonEmpty = entries.filter(([, value]) => clean(value));
  if (!nonEmpty.length) return;
  children.push(
    new Paragraph({ text: title, heading: HeadingLevel.HEADING_2 }),
    ...nonEmpty.map(
      ([label, value]) =>
        new Paragraph({
          children: [
            new TextRun({ text: `${label}: `, bold: true }),
            new TextRun(value),
          ],
          spacing: { after: 120 },
        })
    )
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await hasPermission("reports.export")) || !(await hasPermission("reports.audit.view"))) {
    return NextResponse.json({ error: "Access denied." }, { status: 403 });
  }
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

  const children: (Paragraph | Table)[] = [
    new Paragraph({ text: "Audit Detail Report", heading: HeadingLevel.TITLE }),
    new Paragraph({
      text: "D3 Services HR Management System",
      spacing: { after: 120 },
    }),
    new Paragraph({
      text: `Generated: ${new Date().toLocaleString()}${
        process.env.APP_VERSION ? ` | App Version: ${process.env.APP_VERSION}` : ""
      }`,
      spacing: { after: 240 },
    }),
  ];

  addSection(children, "Audit Summary", [
    ["Date", formatDate(when)],
    ["Time", formatTime(when)],
    ["Module", toReadableLabel(record.module_name)],
    ["Action", toReadableAction(record.action_type)],
    ["Summary", formatValue(record.action_summary)],
  ]);

  addSection(children, "Performed By", [
    ["Name", formatValue(record.performed_by_display_name)],
    ["Role", formatValue(record.role_at_time)],
    ["Email", formatValue(record.performed_by_email)],
  ]);

  addSection(children, "Performed For", [
    ["Employee Name", formatValue(record.related_employee_name)],
    ["File Number", formatValue(record.related_employee_file_number)],
    ["Department", formatValue(record.related_employee_department)],
    ["Job Title", formatValue(record.related_employee_job_title)],
  ]);

  addSection(children, "Device and Network Information", [
    ["IP Address", formatValue(record.ip_address)],
    ["Computer / Device Name", formatValue(record.device_name ?? record.user_agent)],
    ["User Agent", formatValue(record.user_agent)],
  ]);

  addSection(children, "Record Information", [
    ["Entity Type", formatValue(record.entity_type)],
    ["Entity ID", formatValue(record.entity_id)],
    ["Related Module", toReadableLabel(record.module_name)],
  ]);

  if (changedFields.length) {
    children.push(new Paragraph({ text: "Changes Made", heading: HeadingLevel.HEADING_2 }));
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: "Changed Fields: ", bold: true }),
          new TextRun(changedFields.map(toReadableLabel).join(", ")),
        ],
      })
    );
    const table = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph("Field")] }),
            new TableCell({ children: [new Paragraph("Previous Value")] }),
            new TableCell({ children: [new Paragraph("New Value")] }),
          ],
        }),
        ...changedFields.map(
          (field) =>
            new TableRow({
              children: [
                new TableCell({ children: [new Paragraph(toReadableLabel(field))] }),
                new TableCell({ children: [new Paragraph(formatValue(oldObject[field]))] }),
                new TableCell({ children: [new Paragraph(formatValue(newObject[field]))] }),
              ],
            })
        ),
      ],
    });
    children.push(table);
  }

  addSection(children, "Reason / Notes", [
    ["Reason for Change", formatValue(record.reason_for_change)],
  ]);

  const doc = new Document({
    sections: [{ children }],
  });
  const buffer = await Packer.toBuffer(doc);
  return new NextResponse(buffer as BodyInit, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="audit-detail-${id.slice(0, 8)}.docx"`,
      "Cache-Control": "no-store",
    },
  });
}
