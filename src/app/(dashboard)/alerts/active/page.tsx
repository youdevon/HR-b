import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  acknowledgeAlert,
  listActiveAlerts,
  resolveAlert,
  type ActiveAlertFilters,
} from "@/lib/queries/alerts";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { generateAllSystemAlerts } from "@/lib/queries/notifications";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  dashboardButtonPrimaryClass,
  dashboardButtonSecondaryClass,
  dashboardEmptyCardClass,
  dashboardFieldClass,
  dashboardPanelMdClass,
  dashboardTableBodyRowClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";
import { cn } from "@/lib/utils/cn";

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
  await requirePermission("alerts.view");
  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];
  const canBulkManage = hasAnyPermissionForContext(profile, permissions, ["alerts.bulk_manage"]);
  const canAcknowledge = hasAnyPermissionForContext(profile, permissions, ["alerts.acknowledge"]);
  const canResolve = hasAnyPermissionForContext(profile, permissions, ["alerts.resolve"]);
  const sp = await searchParams;
  const filters: ActiveAlertFilters = {
    severity_level: firstString(sp.severity_level),
    status: firstString(sp.status) ?? "active",
    module_name: firstString(sp.module_name),
  };

  const returnTo = buildActiveAlertsPath(filters);

  async function refreshAllAlertsAction() {
    "use server";
    await requirePermission("alerts.bulk_manage");
    await generateAllSystemAlerts();
    revalidatePath("/alerts/active");
    revalidatePath("/dashboard");
  }

  async function acknowledgeAction(formData: FormData) {
    "use server";
    await requirePermission("alerts.acknowledge");
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
    await requirePermission("alerts.resolve");
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
    <main className="space-y-6">
      <PageHeader
        title="Active Alerts"
        description="Operational HR alert queue across active modules."
        backHref="/dashboard"
        actions={
          canBulkManage ? (
            <form action={refreshAllAlertsAction}>
              <button
                type="submit"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
              >
                Refresh All Alerts
              </button>
            </form>
          ) : null
        }
      />

      <section className={dashboardPanelMdClass}>
        <h2 className="text-sm font-semibold text-neutral-900">Filters</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Uses URL query params: <code className="rounded bg-neutral-100 px-1">severity_level</code>,{" "}
          <code className="rounded bg-neutral-100 px-1">status</code>,{" "}
          <code className="rounded bg-neutral-100 px-1">module_name</code>.
        </p>
        <form method="get" className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <label className="flex min-w-[140px] flex-1 flex-col gap-1.5 text-sm font-medium text-neutral-700">
            Severity
            <select name="severity_level" defaultValue={severityValue} className={dashboardFieldClass}>
              <option value="">Any</option>
              <option value="critical">critical</option>
              <option value="warning">warning</option>
              <option value="info">info</option>
            </select>
          </label>
          <label className="flex min-w-[140px] flex-1 flex-col gap-1.5 text-sm font-medium text-neutral-700">
            Status
            <select name="status" defaultValue={statusValue} className={dashboardFieldClass}>
              <option value="">Any</option>
              <option value="active">active</option>
              <option value="acknowledged">acknowledged</option>
            </select>
          </label>
          <label className="flex min-w-[180px] flex-[2] flex-col gap-1.5 text-sm font-medium text-neutral-700">
            Module name
            <input
              type="text"
              name="module_name"
              defaultValue={moduleValue}
              placeholder="e.g. Contracts"
              className={dashboardFieldClass}
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="submit" className={dashboardButtonPrimaryClass}>
              Apply
            </button>
            <Link href="/alerts/active" className={dashboardButtonSecondaryClass}>
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {alerts.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className={dashboardTableHeadCellClass}>Alert</th>
                  <th className={dashboardTableHeadCellClass}>Module</th>
                  <th className={dashboardTableHeadCellClass}>Category</th>
                  <th className={dashboardTableHeadCellClass}>Severity</th>
                  <th className={dashboardTableHeadCellClass}>Status</th>
                  <th className={dashboardTableHeadCellClass}>Triggered</th>
                  <th className={dashboardTableHeadCellClass}>Employee</th>
                  <th className={dashboardTableHeadCellClass}>File #</th>
                  <th className={dashboardTableHeadCellClass}>Actions</th>
                  <th className={dashboardTableHeadCellClass}>Open</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {alerts.map((alert) => (
                  <tr key={alert.id} className={dashboardTableBodyRowClass}>
                    <td className={cn("max-w-[360px]", dashboardTableCellClass)}>
                        <Link href={`/alerts/${alert.id}`} className="font-medium text-neutral-900 hover:underline">
                          {alert.alert_title ?? "Untitled alert"}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                          {alert.alert_message ?? "—"}
                        </p>
                      </td>
                      <td className={cn("whitespace-nowrap", dashboardTableCellClass)}>{alert.module_name ?? "—"}</td>
                      <td className={cn("whitespace-nowrap capitalize", dashboardTableCellClass)}>{alert.alert_category}</td>
                      <td className={cn("whitespace-nowrap", dashboardTableCellClass)}>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityBadgeClass(alert.severity_level)}`}>
                          {alert.severity_level ?? "info"}
                        </span>
                      </td>
                      <td className={cn("whitespace-nowrap", dashboardTableCellClass)}>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(alert.status)}`}>
                          {alert.status ?? "—"}
                        </span>
                      </td>
                      <td className={cn("whitespace-nowrap", dashboardTableCellClass)}>{formatDate(alert.triggered_at)}</td>
                      <td className={cn("whitespace-nowrap", dashboardTableCellClass)}>
                        {alert.employee_name ?? "Not linked to employee"}
                      </td>
                      <td className={cn("whitespace-nowrap", dashboardTableCellClass)}>{alert.employee_file_number ?? "—"}</td>
                      <td className={cn("whitespace-nowrap", dashboardTableCellClass)}>
                        <div className="flex gap-2">
                          {canAcknowledge ? (
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
                          ) : null}
                          {canResolve ? (
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
                          ) : null}
                        </div>
                      </td>
                      <td className={cn("whitespace-nowrap", dashboardTableCellClass)}>
                        {alert.related_record_href ? (
                          <Link
                            href={alert.related_record_href}
                            className="text-sm font-medium text-neutral-900 hover:underline"
                          >
                            Open Record
                          </Link>
                        ) : (
                          <Link
                            href={`/alerts/${alert.id}`}
                            className="text-sm font-medium text-neutral-900 hover:underline"
                          >
                            View Alert
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={dashboardEmptyCardClass}>
              {hasActiveFilters
                ? "No records found for the selected criteria."
                : "Use search or select a filter to view records."}
            </div>
          )}
      </section>
    </main>
  );
}
