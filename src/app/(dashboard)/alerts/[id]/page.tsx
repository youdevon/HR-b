import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
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

function statusBadgeClass(status: string | null): string {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "active") return "bg-red-100 text-red-700 ring-red-200";
  if (normalized === "acknowledged") return "bg-amber-100 text-amber-700 ring-amber-200";
  if (normalized === "resolved") return "bg-emerald-100 text-emerald-700 ring-emerald-200";
  return "bg-neutral-100 text-neutral-700 ring-neutral-200";
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
    revalidatePath("/alerts/active");
    revalidatePath("/dashboard");
    redirect("/alerts/active");
  }

  async function resolveAction() {
    "use server";
    await resolveAlert(id);
    revalidatePath("/alerts/active");
    revalidatePath("/dashboard");
    redirect("/alerts/active");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title={alert.alert_title ?? "Alert Details"}
          description={`Alert ID: ${id}`}
          backHref="/alerts/active"
          actions={
            <>
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
            </>
          }
        />

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${severityBadgeClass(alert.severity_level)}`}>
              {alert.severity_level ?? "info"}
            </span>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusBadgeClass(alert.status)}`}>
              {alert.status ?? "—"}
            </span>
          </div>

          <p className="mt-4 text-sm text-neutral-700">
            {alert.alert_message ?? "No alert message provided."}
          </p>

          <h2 className="mt-8 text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Metadata
          </h2>
          <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-neutral-500">Alert ID</dt>
              <dd className="mt-1 break-all font-mono text-xs font-medium text-neutral-900">{alert.id}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Correlation ID</dt>
              <dd className="mt-1 break-all font-mono text-xs font-medium text-neutral-900">
                {alert.correlation_id ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Module</dt>
              <dd className="mt-1 font-medium text-neutral-900">{alert.module_name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Entity type</dt>
              <dd className="mt-1 font-medium text-neutral-900">{alert.entity_type ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Entity ID</dt>
              <dd className="mt-1 break-all font-mono text-xs font-medium text-neutral-900">
                {alert.entity_id ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Employee ID</dt>
              <dd className="mt-1 font-mono text-xs font-medium text-neutral-900">{alert.employee_id ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Triggered at</dt>
              <dd className="mt-1 font-medium text-neutral-900">{formatDate(alert.triggered_at)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Resolved at</dt>
              <dd className="mt-1 font-medium text-neutral-900">{formatDate(alert.resolved_at)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Created at</dt>
              <dd className="mt-1 font-medium text-neutral-900">{formatDate(alert.created_at)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Updated at</dt>
              <dd className="mt-1 font-medium text-neutral-900">{formatDate(alert.updated_at)}</dd>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <dt className="text-neutral-500">Resolution notes</dt>
              <dd className="mt-1 whitespace-pre-wrap rounded-lg bg-neutral-50 p-3 text-sm font-medium text-neutral-900 ring-1 ring-neutral-100">
                {alert.resolution_notes?.trim() ? alert.resolution_notes : "—"}
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