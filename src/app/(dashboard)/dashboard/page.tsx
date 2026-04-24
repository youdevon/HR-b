import { getDashboardMetrics } from "@/lib/queries/dashboard";
import { listPriorityAlerts } from "@/lib/queries/alerts";
import Link from "next/link";

type MetricCard = {
  label: string;
  value: number;
  hint: string;
  href: string;
};

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

function formatTriggered(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default async function DashboardPage() {
  let metricsError = "";
  let cards: MetricCard[] = [];
  let priorityAlertsError = "";
  const priorityAlerts = await listPriorityAlerts(5).catch((error: unknown) => {
    priorityAlertsError =
      error instanceof Error ? error.message : "Failed to load priority alerts.";
    return [];
  });

  try {
    const metrics = await getDashboardMetrics();
    const resolvedAlertsCount = (metrics as { resolvedAlertsCount?: number })
      .resolvedAlertsCount;
    cards = [
      {
        label: "Active Employees",
        value: metrics.activeEmployeesCount,
        hint: `of ${metrics.totalEmployeesCount} total employees`,
        href: "/employees",
      },
      {
        label: "Active Contracts",
        value: metrics.activeContractsCount,
        hint: `${metrics.contractsExpiringIn30DaysCount} expiring in 30 days`,
        href: "/contracts",
      },
      {
        label: "Contracts Expiring in 30 Days",
        value: metrics.contractsExpiringIn30DaysCount,
        hint: "Contracts ending within the next 30 days",
        href: "/contracts/expiring",
      },
      {
        label: "Expired Contracts",
        value: metrics.expiredContractsCount,
        hint: "Contracts already past end date",
        href: "/contracts/expired",
      },
      {
        label: "Low Sick Leave",
        value: metrics.lowSickLeaveCount,
        hint: "Employees at or below threshold",
        href: "/leave/low-sick",
      },
      {
        label: "Low Vacation Leave",
        value: metrics.lowVacationLeaveCount,
        hint: "Employees at or below threshold",
        href: "/leave/low-vacation",
      },
      {
        label: "Expiring Documents",
        value: metrics.documentsExpiringIn30DaysCount,
        hint: "Documents expiring within 30 days",
        href: "/documents/expiring",
      },
      {
        label: "Files In Transit",
        value: metrics.filesInTransitCount,
        hint: "Transferred or in_transit files",
        href: "/files/in-transit",
      },
      {
        label: "Active Alerts",
        value: metrics.activeAlertsCount,
        hint: "Active and acknowledged alerts in queue",
        href: "/alerts/active",
      },
    ];

    if (typeof resolvedAlertsCount === "number") {
      cards.push({
        label: "Resolved Alerts",
        value: resolvedAlertsCount,
        hint: "Alerts already resolved",
        href: "/alerts/resolved",
      });
    }
  } catch (error) {
    metricsError =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard metrics.";
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-3xl font-semibold text-neutral-900">Dashboard</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Real-time operational metrics from your HR records.
          </p>
        </section>

        {metricsError ? (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            Unable to load dashboard metrics. {metricsError}
          </section>
        ) : null}

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">Priority Alerts</h2>
              <p className="text-sm text-neutral-600">
                Top open items: critical first, then newest. Up to five alerts.
              </p>
            </div>
            <Link
              href="/alerts/active"
              className="text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
            >
              View all active
            </Link>
          </div>
          {priorityAlertsError ? (
            <p className="mt-4 text-sm text-red-600">{priorityAlertsError}</p>
          ) : priorityAlerts.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-600">No active or acknowledged alerts right now.</p>
          ) : (
            <ul className="mt-4 divide-y divide-neutral-100">
              {priorityAlerts.map((alert) => (
                <li key={alert.id}>
                  <Link
                    href={`/alerts/${alert.id}`}
                    className="flex flex-col gap-2 py-4 transition first:pt-0 last:pb-0 hover:bg-neutral-50/80 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:rounded-lg sm:px-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-neutral-900">
                        {alert.alert_title ?? "Untitled alert"}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-neutral-500">
                        {alert.alert_message ?? "—"}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityBadgeClass(alert.severity_level)}`}>
                        {alert.severity_level ?? "info"}
                      </span>
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(alert.status)}`}>
                        {alert.status ?? "—"}
                      </span>
                      <span className="text-xs text-neutral-500">{formatTriggered(alert.triggered_at)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="cursor-pointer rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300"
            >
              <p className="text-sm text-neutral-500">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight text-neutral-900">
                {card.value}
              </p>
              <p className="mt-2 text-xs text-neutral-500">{card.hint}</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}