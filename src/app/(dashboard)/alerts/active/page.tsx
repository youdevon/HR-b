import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  acknowledgeAlert,
  listActiveAlerts,
  resolveAlert,
  type ActiveAlertFilters,
} from "@/lib/queries/alerts";
import { generateAllSystemAlerts } from "@/lib/queries/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  return undefined;
}

function buildActiveAlertsPath(filters: ActiveAlertFilters): string {
  const qs = new URLSearchParams();
  const sev = filters.severity_level?.trim();
  const st = filters.status?.trim();
  const mod = filters.module_name?.trim();
  if (sev) qs.set("severity_level", sev);
  if (st) qs.set("status", st);
  if (mod) qs.set("module_name", mod);
  const q = qs.toString();
  return q ? `/alerts/active?${q}` : "/alerts/active";
}

function isSafeActiveAlertsReturn(path: string): boolean {
  return path === "/alerts/active" || path.startsWith("/alerts/active?");
}

type ActiveAlertsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ActiveAlertsPage({ searchParams }: ActiveAlertsPageProps) {
  const sp = await searchParams;
  const filters: ActiveAlertFilters = {
    severity_level: firstString(sp.severity_level),
    status: firstString(sp.status),
    module_name: firstString(sp.module_name),
  };

  const returnTo = buildActiveAlertsPath(filters);

  async function refreshAllAlertsAction() {
    "use server";
    await generateAllSystemAlerts();
    revalidatePath("/alerts/active");
    revalidatePath("/dashboard");
  }

  async function acknowledgeAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return;
    const next = String(formData.get("returnTo") ?? "/alerts/active");
    await acknowledgeAlert(id);
    revalidatePath("/alerts/active");
    revalidatePath("/dashboard");
    redirect(isSafeActiveAlertsReturn(next) ? next : "/alerts/active");
  }

  async function resolveAction(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return;
    const next = String(formData.get("returnTo") ?? "/alerts/active");
    await resolveAlert(id);
    revalidatePath("/alerts/active");
    revalidatePath("/dashboard");
    redirect(isSafeActiveAlertsReturn(next) ? next : "/alerts/active");
  }

  const alerts = await listActiveAlerts(filters);

  const hasActiveFilters = Boolean(
    filters.severity_level?.trim() ||
      filters.status?.trim() ||
      filters.module_name?.trim()
  );

  const severityValue = filters.severity_level ?? "";
  const statusValue = filters.status ?? "";
  const moduleValue = filters.module_name ?? "";

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Active Alerts"
          description="Central work queue for alerts with status active or acknowledged."
          backHref="/dashboard"
          actions={
            <form action={refreshAllAlertsAction}>
              <button
                type="submit"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                Refresh All Alerts
              </button>
            </form>
          }
        />

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
          <p className="mt-1 text-xs text-neutral-500">
            Uses URL query params: <code className="rounded bg-neutral-100 px-1">severity_level</code>,{" "}
            <code className="rounded bg-neutral-100 px-1">status</code>,{" "}
            <code className="rounded bg-neutral-100 px-1">module_name</code>.
          </p>
          <form method="get" className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs font-medium text-neutral-600">
              Severity
              <select
                name="severity_level"
                defaultValue={severityValue}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Any</option>
                <option value="critical">critical</option>
                <option value="warning">warning</option>
                <option value="info">info</option>
              </select>
            </label>
            <label className="flex min-w-[140px] flex-1 flex-col gap-1 text-xs font-medium text-neutral-600">
              Status
              <select
                name="status"
                defaultValue={statusValue}
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
              >
                <option value="">Any</option>
                <option value="active">active</option>
                <option value="acknowledged">acknowledged</option>
              </select>
            </label>
            <label className="flex min-w-[180px] flex-[2] flex-col gap-1 text-xs font-medium text-neutral-600">
              Module name
              <input
                type="text"
                name="module_name"
                defaultValue={moduleValue}
                placeholder="e.g. Contracts"
                className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Apply
              </button>
              <Link
                href="/alerts/active"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                Clear
              </Link>
            </div>
          </form>
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
                    <th className="px-4 py-3">Actions</th>
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
                        <div className="flex gap-2">
                          <form action={acknowledgeAction}>
                            <input type="hidden" name="id" value={alert.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <button
                              type="submit"
                              className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
                            >
                              Acknowledge
                            </button>
                          </form>
                          <form action={resolveAction}>
                            <input type="hidden" name="id" value={alert.id} />
                            <input type="hidden" name="returnTo" value={returnTo} />
                            <button
                              type="submit"
                              className="rounded-lg border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                            >
                              Resolve
                            </button>
                          </form>
                        </div>
                      </td>
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
              {hasActiveFilters
                ? "No alerts match these filters."
                : "No active or acknowledged alerts in the queue."}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
