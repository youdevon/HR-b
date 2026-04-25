import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { getAuditLogById, listAuditTimelineForEntity } from "@/lib/queries/audit";

type AuditDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
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

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function isSafeReturnPath(path: string): boolean {
  return (
    path.startsWith("/audit/activity") ||
    path.startsWith("/employees/")
  );
}

export default async function AuditDetailPage({
  params,
  searchParams,
}: AuditDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const requestedReturnTo = firstString(sp.return_to) ?? "/audit/activity";
  const returnTo = isSafeReturnPath(requestedReturnTo)
    ? requestedReturnTo
    : "/audit/activity";
  const record = await getAuditLogById(id);

  if (!record) {
    notFound();
  }

  const oldObject = toObject(record.old_values);
  const newObject = toObject(record.new_values);
  const changedFieldNames = Array.from(
    new Set([
      ...(record.changed_fields ?? []),
      ...Object.keys(oldObject),
      ...Object.keys(newObject),
    ])
  ).filter((field) => {
    if ((record.changed_fields ?? []).includes(field)) return true;
    return JSON.stringify(oldObject[field]) !== JSON.stringify(newObject[field]);
  });

  const when = record.event_timestamp ?? record.created_at;
  const timeline = await listAuditTimelineForEntity(
    record.entity_type,
    record.entity_id,
    100
  );

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Audit Event"
          description={record.action_summary}
          backHref="/audit/activity"
        />

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                {record.module_name}
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-900 sm:text-2xl">
                {record.action_summary}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex rounded-lg bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200/80">
                  {record.action_type}
                </span>
                <span className="inline-flex rounded-lg bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200/80">
                  {record.entity_type}
                </span>
                {record.is_sensitive ? (
                  <span className="inline-flex rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                    Sensitive
                  </span>
                ) : null}
              </div>
            </div>
            <p className="shrink-0 text-right text-xs text-neutral-500">
              <span className="block font-mono text-[11px] text-neutral-400">ID</span>
              <span className="font-mono text-neutral-700">{record.id}</span>
            </p>
          </div>
        </section>

        {record.related_employee_name ? (
          <section className="rounded-2xl border border-emerald-200/60 bg-emerald-50/40 p-6 shadow-sm ring-1 ring-emerald-100/80">
            <h2 className="text-sm font-semibold text-emerald-900">Related employee</h2>
            <p className="mt-2 text-lg font-semibold text-emerald-950">{record.related_employee_name}</p>
            <p className="mt-1 text-sm text-emerald-800/90">
              Employee number:{" "}
              <span className="font-mono font-medium">{record.related_employee_number ?? "—"}</span>
            </p>
          </section>
        ) : null}

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Who &amp; when</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-neutral-500">Performed by</dt>
              <dd className="mt-1 text-sm font-semibold text-neutral-900">
                {record.performed_by_name ?? "System"}
              </dd>
              {record.performed_by_user_id ? (
                <dd className="mt-1 font-mono text-xs text-neutral-500">{record.performed_by_user_id}</dd>
              ) : null}
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500">When</dt>
              <dd className="mt-1 text-sm font-semibold text-neutral-900">{formatDate(when)}</dd>
              <dd className="mt-1 text-xs text-neutral-500">
                Recorded {formatDate(record.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500">Source type</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{record.source_type}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500">Role at time</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{record.role_at_time ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-neutral-500">Reason for change</dt>
              <dd className="mt-2 rounded-xl border border-neutral-100 bg-neutral-50/80 p-3 text-sm text-neutral-800">
                {record.reason_for_change ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Entity</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-neutral-500">Entity type</dt>
              <dd className="mt-1 text-sm font-medium text-neutral-900">{record.entity_type}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-neutral-500">Entity ID</dt>
              <dd className="mt-1 break-all font-mono text-xs text-neutral-800">{record.entity_id}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
              Change timeline for this entry
            </h2>
            <span className="text-xs text-neutral-500">{timeline.length} events</span>
          </div>
          {timeline.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">No timeline events available.</p>
          ) : (
            <ol className="mt-4 space-y-3">
              {timeline.map((item) => {
                const itemWhen = item.event_timestamp ?? item.created_at;
                const active = item.id === record.id;
                return (
                  <li
                    key={item.id}
                    className={`rounded-xl border p-3 ${
                      active
                        ? "border-neutral-900 bg-neutral-50"
                        : "border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-md bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-800">
                          {item.action_type}
                        </span>
                        <span className="text-xs text-neutral-500">
                          {item.performed_by_name ?? "System"}
                        </span>
                      </div>
                      <time className="text-xs text-neutral-500">{formatDate(itemWhen)}</time>
                    </div>
                    <p className="mt-1 text-sm text-neutral-800">{item.action_summary}</p>
                    {!active ? (
                      <Link
                        href={`/audit/${item.id}?return_to=${encodeURIComponent(returnTo)}`}
                        className="mt-2 inline-flex text-xs font-medium text-neutral-700 underline-offset-2 hover:underline"
                      >
                        Open this event
                      </Link>
                    ) : (
                      <p className="mt-2 text-xs font-medium text-neutral-900">Currently viewing</p>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Changed fields</h2>
          {changedFieldNames.length === 0 ? (
            <p className="mt-3 text-sm text-neutral-600">No field-level changes were recorded.</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {changedFieldNames.map((field) => (
                <span
                  key={field}
                  className="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-900 ring-1 ring-violet-200/80"
                >
                  {field}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-red-800/90">Old values</h2>
            {changedFieldNames.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">—</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {changedFieldNames.map((field) => (
                  <li
                    key={`old-${field}`}
                    className="rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{field}</p>
                    <p className="mt-1 break-words text-neutral-800">{toDisplayValue(oldObject[field])}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-emerald-800/90">New values</h2>
            {changedFieldNames.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-600">—</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {changedFieldNames.map((field) => (
                  <li
                    key={`new-${field}`}
                    className="rounded-xl border border-emerald-100/80 bg-emerald-50/30 p-3 text-sm"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800/70">{field}</p>
                    <p className="mt-1 break-words text-neutral-900">{toDisplayValue(newObject[field])}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-neutral-950 p-6 text-neutral-100 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-400">Raw JSON</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium text-neutral-500">old_values</p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed">
                {JSON.stringify(record.old_values, null, 2)}
              </pre>
            </div>
            <div>
              <p className="text-xs font-medium text-neutral-500">new_values</p>
              <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/30 p-3 text-xs leading-relaxed">
                {JSON.stringify(record.new_values, null, 2)}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
