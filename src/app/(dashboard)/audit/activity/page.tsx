import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { listRecentAuditLogs } from "@/lib/queries/audit";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

type AuditActivityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function AuditActivityPage({ searchParams }: AuditActivityPageProps) {
  const sp = await searchParams;
  const employeeId = firstString(sp.employee_id)?.trim();
  const logs = await listRecentAuditLogs(100, employeeId);
  const currentPath = employeeId
    ? `/audit/activity?employee_id=${encodeURIComponent(employeeId)}`
    : "/audit/activity";

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="space-y-3">
          <PageHeader
            title="Audit Activity"
            description="Recent changes across the system. Employee-related rows show the affected person when the audit target is an employee record."
            backHref="/dashboard"
            actions={
              employeeId ? (
              <Link
                href="/audit/activity"
                className="inline-flex rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
              >
                Clear employee filter
              </Link>
            ) : null
            }
          />
          {employeeId ? (
            <p className="mt-3 text-sm text-neutral-700">
              Showing audit history for employee ID:
              <span className="ml-1 font-mono text-xs text-neutral-900">{employeeId}</span>
            </p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-1 shadow-sm sm:p-2">
          {logs.length === 0 ? (
            <div className="px-6 py-14 text-center text-sm text-neutral-600">
              {employeeId
                ? "No audit history was found for this employee."
                : "No audit activity has been recorded yet."}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl">
              <table className="min-w-[1100px] w-full divide-y divide-neutral-200 text-sm">
                <thead>
                  <tr className="bg-neutral-50/90 text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    <th className="whitespace-nowrap px-4 py-3">Event time</th>
                    <th className="whitespace-nowrap px-4 py-3">Module</th>
                    <th className="whitespace-nowrap px-4 py-3">Action</th>
                    <th className="min-w-[200px] px-4 py-3">Summary</th>
                    <th className="whitespace-nowrap px-4 py-3">Performed by</th>
                    <th className="min-w-[160px] px-4 py-3">Related employee</th>
                    <th className="whitespace-nowrap px-4 py-3">Entity</th>
                    <th className="whitespace-nowrap px-4 py-3">Sensitive</th>
                    <th className="whitespace-nowrap px-4 py-3">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white text-neutral-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="transition hover:bg-neutral-50/80">
                      <td className="whitespace-nowrap px-4 py-3 text-neutral-700">
                        {formatDate(log.event_timestamp ?? log.created_at)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                        {log.module_name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="inline-flex rounded-lg bg-neutral-100 px-2 py-1 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200/80">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-3">
                        <p className="line-clamp-2 text-neutral-700">{log.action_summary}</p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-medium text-neutral-900">
                          {log.performed_by_display_name}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {log.related_employee_name ? (
                          <div>
                            <p className="font-medium text-neutral-900">{log.related_employee_name}</p>
                            <p className="text-xs text-neutral-500">
                              {log.related_employee_number ?? "—"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-600">
                        <span className="font-medium text-neutral-800">{log.entity_type}</span>
                        <span className="mx-1 text-neutral-300">·</span>
                        <span className="font-mono text-[11px] text-neutral-500">{log.entity_id}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {log.is_sensitive ? (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                            Yes
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-neutral-200">
                            No
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/audit/${log.id}?return_to=${encodeURIComponent(currentPath)}`}
                          className="text-sm font-semibold text-neutral-900 underline-offset-2 hover:underline"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
