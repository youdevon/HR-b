import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { listPriorityAlerts, type AlertRecord } from "@/lib/queries/alerts";
import { getDashboardMetrics } from "@/lib/queries/dashboard";
import { generateAllSystemAlerts } from "@/lib/queries/notifications";

type MetricTone = "critical" | "warning" | "normal" | "success";

type MetricCard = {
  label: string;
  value: number;
  hint: string;
  href: string;
  tone: MetricTone;
};

type DashboardSection = {
  title: string;
  description: string;
  cards: MetricCard[];
};

const toneClasses: Record<MetricTone, string> = {
  critical: "border-red-200 bg-red-50/50 text-red-700",
  warning: "border-amber-200 bg-amber-50/50 text-amber-700",
  normal: "border-neutral-200 bg-white text-neutral-700",
  success: "border-emerald-200 bg-emerald-50/50 text-emerald-700",
};

const severityBadgeClasses: Record<string, string> = {
  critical: "bg-red-100 text-red-700 ring-red-200",
  warning: "bg-amber-100 text-amber-700 ring-amber-200",
  info: "bg-blue-100 text-blue-700 ring-blue-200",
};

function formatTriggeredAt(value: string | null): string {
  if (!value) return "Not recorded";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function dashboardSections(metrics: Awaited<ReturnType<typeof getDashboardMetrics>>): DashboardSection[] {
  return [
    {
      title: "Alerts & Action Items",
      description: "Open alert queue and critical items requiring attention.",
      cards: [
        {
          label: "Active Alerts",
          value: metrics.activeAlertsCount,
          hint: "Active and acknowledged alerts",
          href: "/alerts/active",
          tone: metrics.activeAlertsCount > 0 ? "warning" : "normal",
        },
        {
          label: "Critical Alerts",
          value: metrics.criticalAlertsCount,
          hint: "Critical active or acknowledged alerts",
          href: "/alerts/active?severity_level=critical",
          tone: metrics.criticalAlertsCount > 0 ? "critical" : "normal",
        },
      ],
    },
    {
      title: "Contracts",
      description: "Contract coverage, expiry exposure, and renewal risk.",
      cards: [
        {
          label: "Active Contracts",
          value: metrics.activeContractsCount,
          hint: "Contracts currently active",
          href: "/contracts",
          tone: "success",
        },
        {
          label: "Contracts Expiring Soon",
          value: metrics.contractsExpiringIn30DaysCount,
          hint: "Contracts ending within 30 days",
          href: "/contracts/expiring",
          tone: metrics.contractsExpiringIn30DaysCount > 0 ? "warning" : "normal",
        },
        {
          label: "Expired Contracts",
          value: metrics.expiredContractsCount,
          hint: "Contracts already past end date",
          href: "/contracts/expired",
          tone: metrics.expiredContractsCount > 0 ? "critical" : "normal",
        },
      ],
    },
    {
      title: "Workforce Overview",
      description: "Current workforce size and active employee population.",
      cards: [
        {
          label: "Total Employees",
          value: metrics.totalEmployeesCount,
          hint: "All employee records in the system",
          href: "/employees",
          tone: "normal",
        },
        {
          label: "Active Employees",
          value: metrics.activeEmployeesCount,
          hint: "Employees currently marked active",
          href: "/employees",
          tone: "success",
        },
      ],
    },
    {
      title: "Leave",
      description: "Approval workload, attendance today, and leave balance pressure.",
      cards: [
        {
          label: "Pending Leave Approvals",
          value: metrics.pendingLeaveApprovalsCount,
          hint: "Leave requests awaiting action",
          href: "/leave/transactions?q=pending",
          tone: metrics.pendingLeaveApprovalsCount > 0 ? "warning" : "normal",
        },
        {
          label: "Employees Currently On Leave",
          value: metrics.employeesOnLeaveCount,
          hint: "Approved leave active today",
          href: "/leave/transactions?q=approved",
          tone: "normal",
        },
        {
          label: "Low Sick Leave",
          value: metrics.lowSickLeaveCount,
          hint: "Employees at or below sick leave threshold",
          href: "/leave/low-sick",
          tone: metrics.lowSickLeaveCount > 0 ? "warning" : "normal",
        },
        {
          label: "Low Vacation Leave",
          value: metrics.lowVacationLeaveCount,
          hint: "Employees at or below vacation threshold",
          href: "/leave/low-vacation",
          tone: metrics.lowVacationLeaveCount > 0 ? "warning" : "normal",
        },
      ],
    },
    {
      title: "Documents",
      description: "Document expiry exposure and compliance risk.",
      cards: [
        {
          label: "Documents Expiring Soon",
          value: metrics.documentsExpiringIn30DaysCount,
          hint: "Documents expiring within 30 days",
          href: "/documents/expiring",
          tone: metrics.documentsExpiringIn30DaysCount > 0 ? "warning" : "normal",
        },
        {
          label: "Expired Documents",
          value: metrics.expiredDocumentsCount,
          hint: "Documents already past expiry date",
          href: "/documents/expired",
          tone: metrics.expiredDocumentsCount > 0 ? "critical" : "normal",
        },
      ],
    },
    {
      title: "Physical Files",
      description: "Physical file movement and custody risk.",
      cards: [
        {
          label: "Files In Transit",
          value: metrics.filesInTransitCount,
          hint: "Physical files moving between locations",
          href: "/files/in-transit",
          tone: metrics.filesInTransitCount > 0 ? "warning" : "normal",
        },
        {
          label: "Missing Files",
          value: metrics.missingFilesCount,
          hint: "Physical files marked missing",
          href: "/files/missing",
          tone: metrics.missingFilesCount > 0 ? "critical" : "normal",
        },
      ],
    },
  ];
}

function DashboardCard({ card }: { card: MetricCard }) {
  return (
    <Link
      href={card.href}
      className={`group rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 ${toneClasses[card.tone]}`}
    >
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm font-medium text-neutral-600">{card.label}</p>
        <span className="h-2.5 w-2.5 rounded-full bg-current opacity-70 transition group-hover:opacity-100" />
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-neutral-950">
        {card.value}
      </p>
      <p className="mt-2 text-xs leading-5 text-neutral-500">{card.hint}</p>
    </Link>
  );
}

function MetricSection({ section }: { section: DashboardSection }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{section.title}</h2>
        <p className="mt-1 text-sm text-neutral-600">{section.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {section.cards.map((card) => (
          <DashboardCard key={`${section.title}-${card.label}`} card={card} />
        ))}
      </div>
    </section>
  );
}

function PriorityAlerts({ alerts }: { alerts: AlertRecord[] }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Priority Alerts</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Top active and acknowledged alerts, ordered by severity.
          </p>
        </div>
        <Link
          href="/alerts/active"
          className="text-sm font-medium text-neutral-600 hover:text-neutral-900"
        >
          View all alerts
        </Link>
      </div>

      <div className="mt-5 space-y-3">
        {alerts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5 text-sm text-neutral-600">
            No active priority alerts.
          </div>
        ) : (
          alerts.map((alert) => {
            const severity = (alert.severity_level ?? "info").toLowerCase();
            const badgeClass =
              severityBadgeClasses[severity] ??
              "bg-neutral-100 text-neutral-700 ring-neutral-200";

            return (
              <Link
                key={alert.id}
                href={`/alerts/${alert.id}`}
                className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                        {alert.module_name ?? "General"}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${badgeClass}`}
                      >
                        {alert.severity_level ?? "info"}
                      </span>
                    </div>
                    <p className="mt-2 font-medium text-neutral-900">
                      {alert.alert_title ?? "Untitled alert"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-neutral-500">
                    {formatTriggeredAt(alert.triggered_at)}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  // Auth is resolved once in `(dashboard)/layout`; this page only fetches dashboard data.
  let metricsError = "";
  let sections: DashboardSection[] = [];
  let priorityAlerts: AlertRecord[] = [];

  await generateAllSystemAlerts().catch(() => 0);

  try {
    const [metrics, alerts] = await Promise.all([
      getDashboardMetrics(),
      listPriorityAlerts(5),
    ]);
    sections = dashboardSections(metrics);
    priorityAlerts = alerts;
  } catch (error) {
    metricsError =
      error instanceof Error
        ? error.message
        : "Failed to load dashboard metrics.";
  }

  const [alertsSection, ...remainingSections] = sections;

  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <PageHeader
          title="Dashboard"
          description="Monitor employee coverage, contract exposure, leave pressure, files, documents, and priority alerts from one dashboard."
        />
      </section>

      {metricsError ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Unable to load dashboard metrics. {metricsError}
        </section>
      ) : null}

      {alertsSection ? (
        <MetricSection section={alertsSection} />
      ) : null}

      <PriorityAlerts alerts={priorityAlerts} />

      {remainingSections.map((section) => (
        <MetricSection key={section.title} section={section} />
      ))}
    </main>
  );
}