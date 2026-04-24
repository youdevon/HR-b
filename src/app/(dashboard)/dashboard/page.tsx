import { getDashboardMetrics } from "@/lib/queries/dashboard";
import Link from "next/link";

type MetricCard = {
  label: string;
  value: number;
  hint: string;
  href: string;
};

export default async function DashboardPage() {
  let metricsError = "";
  let cards: MetricCard[] = [];

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