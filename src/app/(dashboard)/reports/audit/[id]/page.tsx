import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { getAuditLogById } from "@/lib/queries/audit";
import Link from "next/link";
import { requirePermission } from "@/lib/auth/guards";

type PageProps = {
  params: Promise<{ id: string }>;
};

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
  if (!normalized) return "—";
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
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export default async function Page({ params }: PageProps) {
  await requirePermission("reports.audit.view");
  const { id } = await params;
  const record = await getAuditLogById(id);
  if (!record) notFound();

  const when = record.event_timestamp ?? record.created_at;
  const oldObject = toObject(record.old_values);
  const newObject = toObject(record.new_values);
  const changedFields = Array.from(
    new Set([
      ...(record.changed_fields ?? []),
      ...Object.keys(oldObject),
      ...Object.keys(newObject),
    ])
  ).filter(
    (field) => JSON.stringify(oldObject[field]) !== JSON.stringify(newObject[field]) || (record.changed_fields ?? []).includes(field)
  );

  return (
    <main className="space-y-6">
      <PageHeader
        title="Audit Detail"
        description="Detailed view of one audit event."
        backHref="/reports"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/api/reports/audit/${record.id}/docx`}
              className="inline-flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900"
            >
              Export DOCX
            </Link>
            <Link
              href={`/api/reports/audit/${record.id}/txt`}
              className="inline-flex h-10 items-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900"
            >
              Export TXT
            </Link>
          </div>
        }
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-700">
          <span className="font-medium text-neutral-900">Action:</span> {toReadableAction(record.action_type)}
          <br />
          <span className="font-medium text-neutral-900">Performed By:</span>{" "}
          {record.performed_by_display_name}
          <br />
          <span className="font-medium text-neutral-900">Performed For:</span>{" "}
          {record.performed_for_display}
          <br />
          <span className="font-medium text-neutral-900">When:</span> {formatDate(when)} at{" "}
          {formatTime(when)}
          <br />
          <span className="font-medium text-neutral-900">Summary:</span> {record.action_summary}
        </p>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="Date" value={formatDate(when)} />
          <Detail label="Time" value={formatTime(when)} />
          <Detail label="Module" value={toReadableLabel(record.module_name)} />
          <Detail label="Action" value={toReadableAction(record.action_type)} />
          <Detail label="Summary" value={record.action_summary} />
          <Detail label="Performed By" value={record.performed_by_display_name} />
          <Detail label="Performed For" value={record.performed_for_display} />
          <Detail label="IP Address" value={record.ip_address ?? "—"} />
          <Detail
            label="Computer / Device Name"
            value={record.device_name ?? record.user_agent ?? "—"}
          />
          <Detail label="Entity Type" value={record.entity_type} />
          <Detail label="Entity ID" value={record.entity_id} />
          <Detail
            label="Changed Fields"
            value={changedFields.length ? changedFields.join(", ") : "—"}
          />
          <Detail label="Reason for Change" value={record.reason_for_change ?? "—"} />
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">Before / After</h2>
        {changedFields.length === 0 ? (
          <p className="mt-3 text-sm text-neutral-600">
            No detailed field changes were recorded for this action.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
                <tr>
                  <th className="px-4 py-3">Field</th>
                  <th className="px-4 py-3">Previous Value</th>
                  <th className="px-4 py-3">New Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {changedFields.map((field) => (
                  <tr key={field}>
                    <td className="px-4 py-3 font-medium text-neutral-900">{field}</td>
                    <td className="px-4 py-3">{toDisplayValue(oldObject[field])}</td>
                    <td className="px-4 py-3">{toDisplayValue(newObject[field])}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="text-sm font-medium text-neutral-900 break-words">{value}</p>
    </div>
  );
}
