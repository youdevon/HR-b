import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  DASHBOARD_CARD_PERMISSION_KEYS,
  hasAnyPermissionForContext,
  hasPermissionForContext,
  profileDisplayName,
} from "@/lib/auth/permissions";
import { isAuthRateLimitError, requireDashboardAuth } from "@/lib/auth/guards";
import type { DashboardAuthContext } from "@/lib/auth/guards";
import { getDashboardMetrics } from "@/lib/queries/dashboard";
import { dashboardAlertErrorClass, dashboardEmptyCardClass } from "@/lib/ui/dashboard-styles";

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

function dashboardSections(metrics: Awaited<ReturnType<typeof getDashboardMetrics>>): DashboardSection[] {
  return [
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
          label: "Contracts Expiring in 90 Days",
          value: metrics.contractsExpiringIn90DaysCount,
          hint: "Contracts ending within 90 days",
          href: "/contracts?status=expiring&days=90",
          tone: metrics.contractsExpiringIn90DaysCount > 0 ? "warning" : "normal",
        },
        {
          label: "Expired Contracts",
          value: metrics.expiredContractsCount,
          hint: "Contracts already past end date",
          href: "/contracts?status=expired",
          tone: metrics.expiredContractsCount > 0 ? "critical" : "normal",
        },
      ],
    },
    {
      title: "Employees",
      description: "Current workforce size and active employee population.",
      cards: [
        {
          label: "Total Employees",
          value: metrics.totalEmployeesCount,
          hint: "All employees in the system",
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

type DashboardCardVisibility = {
  workforce: boolean;
  contracts: boolean;
  leave: boolean;
  files: boolean;
};

function filterSectionsByPermissions(
  sections: DashboardSection[],
  visibility: DashboardCardVisibility
): DashboardSection[] {
  return sections
    .map((section) => {
      if (section.title === "Employees" && !visibility.workforce) return null;
      if (section.title === "Contracts" && !visibility.contracts) return null;
      if (section.title === "Leave" && !visibility.leave) return null;
      if (section.title === "Physical Files" && !visibility.files) return null;
      return section;
    })
    .filter((section): section is DashboardSection => Boolean(section));
}

function DashboardCard({ card }: { card: MetricCard }) {
  return (
    <Link
      href={card.href}
      className={`group flex min-h-36 flex-col justify-between rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 ${toneClasses[card.tone]}`}
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
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold text-neutral-900">{section.title}</h2>
        <p className="mt-1 text-sm text-neutral-600">{section.description}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.cards.map((card) => (
          <DashboardCard key={`${section.title}-${card.label}`} card={card} />
        ))}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  let auth: DashboardAuthContext;
  try {
    auth = await requireDashboardAuth();
  } catch (error) {
    if (isAuthRateLimitError(error)) {
      return (
        <main className="space-y-6">
          <PageHeader
            title="Dashboard"
            description="Monitor employee coverage, contract exposure, leave pressure, and file movement from one dashboard."
          />
          <section className={dashboardAlertErrorClass} role="alert">
            Authentication is temporarily rate-limited. Please wait a moment and refresh this page.
          </section>
        </main>
      );
    }
    throw error;
  }
  const profile = auth.profile ?? null;
  const permissions = auth.permissions ?? [];

  if (!hasPermissionForContext(profile, permissions, "dashboard.view")) {
    return (
      <main className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Monitor employee coverage, contract exposure, leave pressure, and file movement from one dashboard."
        />
        <section className={dashboardAlertErrorClass} role="alert">
          Access denied. You do not have permission to view the dashboard.
        </section>
      </main>
    );
  }

  const visibility: DashboardCardVisibility = {
    workforce: hasAnyPermissionForContext(profile, permissions, [...DASHBOARD_CARD_PERMISSION_KEYS.workforce]),
    contracts: hasAnyPermissionForContext(profile, permissions, [...DASHBOARD_CARD_PERMISSION_KEYS.contracts]),
    leave: hasAnyPermissionForContext(profile, permissions, [...DASHBOARD_CARD_PERMISSION_KEYS.leave]),
    files: hasAnyPermissionForContext(profile, permissions, [...DASHBOARD_CARD_PERMISSION_KEYS.files]),
  };

  const hasAnyCards = Object.values(visibility).some(Boolean);
  let metricsError = "";
  let sections: DashboardSection[] = [];

  if (hasAnyCards) {
    try {
      const metrics = await getDashboardMetrics(visibility);
      sections = filterSectionsByPermissions(dashboardSections(metrics), visibility);
    } catch (error) {
      metricsError =
        error instanceof Error
          ? error.message
          : "Failed to load dashboard metrics.";
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Monitor employee coverage, contract exposure, leave pressure, and file movement from one dashboard."
      />

      {metricsError ? (
        <section className={dashboardAlertErrorClass} role="alert">
          Unable to load dashboard metrics. {metricsError}
        </section>
      ) : null}

      {!hasAnyCards ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-2xl font-bold text-neutral-900">
            Welcome Back, {profile?.first_name || profileDisplayName(profile)}
          </h2>
          <p className="mt-2 text-sm text-neutral-600">
            You currently do not have dashboard cards assigned to your role.
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Please use the navigation menu to access your available areas.
          </p>
        </section>
      ) : (
        sections.map((section) => <MetricSection key={section.title} section={section} />)
      )}
    </main>
  );
}