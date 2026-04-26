import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { getDashboardSession } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { formatReadableDate, listLowSickLeave } from "@/lib/queries/leave";
import {
  dashboardButtonPrimaryClass,
  dashboardButtonSecondaryClass,
  dashboardFieldClass,
} from "@/lib/ui/dashboard-styles";

type LowSickLeavePageProps = {
  searchParams: Promise<{ q?: string }>;
};

function matchesLowLeaveQuery(
  row: Awaited<ReturnType<typeof listLowSickLeave>>[number],
  query: string
): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const employeeName = (row.employee_name ?? "").toLowerCase();
  const fileNumber = (row.employee_file_number ?? "").toLowerCase();
  const leaveType = "sick leave";
  return (
    employeeName.includes(q) ||
    fileNumber.includes(q) ||
    leaveType.includes(q)
  );
}

function sickDayText(remaining: number): string {
  return remaining === 1
    ? "1 more sick day remaining."
    : `${remaining} more sick days remaining.`;
}

export default async function LowSickLeavePage({
  searchParams,
}: LowSickLeavePageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];
  const canCreateLeave = hasAnyPermissionForContext(profile, permissions, ["leave.create"]);
  const rows = await listLowSickLeave();
  const filteredRows = rows.filter((row) => matchesLowLeaveQuery(row, query));
  const emptyMessage = query
    ? "No records found for the selected criteria."
    : "No low sick leave balances found.";

  return (
    <main className="space-y-6">
      <PageHeader
        title="Low Sick Leave"
        description="Sick leave balances at or below the warning threshold."
        backHref="/leave"
        actions={
          <>
            <form action="/leave/low-sick" className="flex flex-col gap-2 sm:flex-row">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search employee, file #, leave type..."
                className={`h-10 min-w-72 ${dashboardFieldClass}`}
              />
              <button type="submit" className={dashboardButtonSecondaryClass}>
                Search
              </button>
              {query ? (
                <Link href="/leave/low-sick" className={dashboardButtonSecondaryClass}>
                  Clear
                </Link>
              ) : null}
            </form>
            {canCreateLeave ? (
              <Link href="/leave/new" className={dashboardButtonPrimaryClass}>
                Apply Leave
              </Link>
            ) : null}
          </>
        }
      />

      {filteredRows.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">{emptyMessage}</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="space-y-3">
            {filteredRows.map((row) => {
              const remaining = Number(row.remaining_days ?? 0);
              const employee = row.employee_name ?? "Unknown Employee";
              return (
                <div key={row.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-sm text-neutral-800">
                    <span className="font-semibold text-neutral-900">{employee}</span>{" "}
                    has {sickDayText(remaining)}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Effective period: {formatReadableDate(row.effective_from)} to {formatReadableDate(row.effective_to)}
                    {row.employee_file_number ? ` • File #${row.employee_file_number}` : ""}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}