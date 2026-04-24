import Link from "next/link";
import { generateContractExpiryAlerts, listActiveAlerts } from "@/lib/queries/alerts";
import { revalidatePath } from "next/cache";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function severityBadgeClass(level: string | null): string {
  const normalized = (level ?? "").toLowerCase();
  if (normalized === "critical") return "bg-red-100 text-red-700 ring-red-200";
  if (normalized === "warning") return "bg-orange-100 text-orange-700 ring-orange-200";
  return "bg-blue-100 text-blue-700 ring-blue-200";
}

function statusBadgeClass(status: string | null): string {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "active") return "bg-red-100 text-red-700 ring-red-200";
  if (normalized === "acknowledged") return "bg-amber-100 text-amber-700 ring-amber-200";
  return "bg-neutral-100 text-neutral-700 ring-neutral-200";
}

export default async function ActiveAlertsPage() {
  async function refreshContractAlertsAction() {
    "use server";
    await generateContractExpiryAlerts();
    revalidatePath("/alerts/active");
  }

  const alerts = await listActiveAlerts();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Active Alerts</h1>
              <p className="mt-1 text-sm text-neutral-600">
                Central work queue for alerts with status active or acknowledged.
              </p>
            </div>
            <form action={refreshContractAlertsAction}>
              <button
                type="submit"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                Refresh Contract Alerts
              </button>
            </form>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          {alerts.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200 text-sm">
                <thead className="bg-neutral-50">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                    <th className="px-4 py-3">Alert</th>
                    <th className="px-4 py-3">Module</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Triggered</th>
                    <th className="px-4 py-3">Employee</th>
                    <th className="px-4 py-3">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                  {alerts.map((alert) => (
                    <tr key={alert.id} className="hover:bg-neutral-50">
                      <td className="max-w-[360px] px-4 py-3">
                        <Link href={`/alerts/${alert.id}`} className="font-medium text-neutral-900 hover:underline">
                          {alert.alert_title ?? "Untitled alert"}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                          {alert.alert_message ?? "—"}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{alert.module_name ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityBadgeClass(alert.severity_level)}`}>
                          {alert.severity_level ?? "info"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(alert.status)}`}>
                          {alert.status ?? "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(alert.triggered_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3">{alert.employee_id ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link
                          href={`/alerts/${alert.id}`}
                          className="text-sm font-medium text-neutral-900 hover:underline"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center text-sm text-neutral-600">
              No active or acknowledged alerts in the queue.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
