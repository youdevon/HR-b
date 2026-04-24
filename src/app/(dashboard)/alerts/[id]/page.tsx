import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  acknowledgeAlert,
  getAlertById,
  resolveAlert,
} from "@/lib/queries/alerts";

type AlertDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

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

export default async function AlertDetailPage({
  params,
}: AlertDetailPageProps) {
  const { id } = await params;
  const alert = await getAlertById(id);

  if (!alert) {
    notFound();
  }

  async function acknowledgeAction() {
    "use server";
    await acknowledgeAlert(id);
    redirect(`/alerts/${id}`);
  }

  async function resolveAction() {
    "use server";
    await resolveAlert(id);
    redirect(`/alerts/${id}`);
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                {alert.alert_title ?? "Alert Details"}
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Alert ID: {id}
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/alerts/active"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                Active Queue
              </Link>
              <Link
                href="/alerts/resolved"
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                Resolved
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityBadgeClass(alert.severity_level)}`}>
              {alert.severity_level ?? "info"}
            </span>
            <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700 ring-1 ring-neutral-200">
              {alert.status ?? "—"}
            </span>
          </div>

          <p className="mt-4 text-sm text-neutral-700">
            {alert.alert_message ?? "No alert message provided."}
          </p>

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-neutral-500">Module</dt>
              <dd className="mt-1 font-medium text-neutral-900">{alert.module_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Employee ID</dt>
              <dd className="mt-1 font-medium text-neutral-900">{alert.employee_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Triggered At</dt>
              <dd className="mt-1 font-medium text-neutral-900">{formatDate(alert.triggered_at)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Resolved At</dt>
              <dd className="mt-1 font-medium text-neutral-900">{formatDate(alert.resolved_at)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-neutral-500">Resolution Notes</dt>
              <dd className="mt-1 whitespace-pre-wrap font-medium text-neutral-900">
                {alert.resolution_notes ?? "—"}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-wrap gap-3">
            <form action={acknowledgeAction}>
              <button
                type="submit"
                className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100"
              >
                Acknowledge
              </button>
            </form>
            <form action={resolveAction}>
              <button
                type="submit"
                className="rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100"
              >
                Resolve
              </button>
            </form>
          </div>
        </section>
      </div>
    </main>
  );
}