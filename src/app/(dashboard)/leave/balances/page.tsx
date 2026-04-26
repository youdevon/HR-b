import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import EmptyStateCard from "@/components/ui/empty-state-card";
import { createClient } from "@/lib/supabase/server";
import { formatLeaveType, formatReadableDate, listLeaveBalances } from "@/lib/queries/leave";
import { dashboardPanelClass } from "@/lib/ui/dashboard-styles";

type LeaveBalanceEmployeeRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  file_number: string | null;
};

type LeaveBalanceWithComputed = Awaited<ReturnType<typeof listLeaveBalances>>[number] & {
  computed_rollover_days: number;
  is_current_contract_year: boolean;
};

const PAGE_SIZE = 20;
const MAX_RESULTS = 200;

function employeeDisplayName(employee?: LeaveBalanceEmployeeRow): string {
  const fullName = `${employee?.first_name ?? ""} ${employee?.last_name ?? ""}`.trim();
  return fullName || "Unknown Employee";
}

function readableLeaveType(value: string | null | undefined): string {
  const formatted = formatLeaveType(value);
  if (formatted === "-") return formatted;
  return formatted.toLowerCase().endsWith("leave") ? formatted : `${formatted} Leave`;
}

function isWithinCurrentDateRange(
  effectiveFrom: string | null | undefined,
  effectiveTo: string | null | undefined,
  today: string
): boolean {
  const from = (effectiveFrom ?? "").trim();
  const to = (effectiveTo ?? "").trim();
  return Boolean(from && to && from <= today && today <= to);
}

function computeBalancesWithRollover(
  rows: Awaited<ReturnType<typeof listLeaveBalances>>
): LeaveBalanceWithComputed[] {
  const today = new Date().toISOString().slice(0, 10);
  const byContract = new Map<string, Awaited<ReturnType<typeof listLeaveBalances>>>();

  for (const row of rows) {
    const key = (row.contract_id ?? "__no_contract__").trim() || "__no_contract__";
    const list = byContract.get(key) ?? [];
    list.push(row);
    byContract.set(key, list);
  }

  const computedById = new Map<string, LeaveBalanceWithComputed>();

  for (const [, contractRows] of byContract) {
    const vacationRows = contractRows
      .filter((row) => (row.leave_type ?? "").trim().toLowerCase() === "vacation_leave")
      .sort((a, b) => {
        const ay = Number(a.balance_year ?? 0);
        const by = Number(b.balance_year ?? 0);
        if (ay !== by) return ay - by;
        return String(a.effective_from ?? "").localeCompare(String(b.effective_from ?? ""));
      });

    const explicitCurrent = vacationRows.find((row) =>
      isWithinCurrentDateRange(row.effective_from, row.effective_to, today)
    );
    const fallbackCurrent = vacationRows[vacationRows.length - 1] ?? null;
    const currentId = (explicitCurrent ?? fallbackCurrent)?.id ?? null;

    for (const row of contractRows) {
      const leaveType = (row.leave_type ?? "").trim().toLowerCase();
      const isVacation = leaveType === "vacation_leave";
      const isCurrentContractYear = Boolean(currentId && row.id === currentId);

      let computedRolloverDays = 0;
      if (isVacation && isCurrentContractYear) {
        const thisYear = Number(row.balance_year ?? 0);
        const previousUnused = vacationRows
          .filter((vacationRow) => Number(vacationRow.balance_year ?? 0) < thisYear)
          .reduce(
            (sum, vacationRow) => sum + Math.max(0, Number(vacationRow.remaining_days ?? 0)),
            0
          );
        const carriedForward = Math.max(0, Number(row.carried_forward_days ?? 0));
        computedRolloverDays = carriedForward > 0 ? carriedForward : previousUnused;
      }

      computedById.set(row.id, {
        ...row,
        computed_rollover_days: computedRolloverDays,
        is_current_contract_year: isCurrentContractYear,
      });
    }
  }

  return rows.map((row) => computedById.get(row.id) ?? {
    ...row,
    computed_rollover_days: 0,
    is_current_contract_year: false,
  });
}

export default async function LeaveBalancesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) ?? {};
  const pageRaw = Array.isArray(sp.page) ? sp.page[0] : sp.page;
  const parsedPage = Number.parseInt(String(pageRaw ?? "1"), 10);
  const currentPage = Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const rows = await listLeaveBalances({ limit: MAX_RESULTS });
  const computedRows = computeBalancesWithRollover(rows);
  const employeeIds = [
    ...new Set(computedRows.map((row) => row.employee_id).filter((id): id is string => Boolean(id))),
  ];
  const employeeById = new Map<string, LeaveBalanceEmployeeRow>();

  if (employeeIds.length > 0) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, file_number")
      .in("id", employeeIds);
    for (const row of (data ?? []) as LeaveBalanceEmployeeRow[]) {
      employeeById.set(row.id, row);
    }
  }

  const sortedRows = [...computedRows].sort((a, b) => {
    const employeeA = a.employee_id ? employeeById.get(a.employee_id) : undefined;
    const employeeB = b.employee_id ? employeeById.get(b.employee_id) : undefined;
    const nameA = employeeDisplayName(employeeA).toLowerCase();
    const nameB = employeeDisplayName(employeeB).toLowerCase();
    const nameCmp = nameA.localeCompare(nameB);
    if (nameCmp !== 0) return nameCmp;

    const yearA = Number(a.balance_year ?? 0);
    const yearB = Number(b.balance_year ?? 0);
    if (yearA !== yearB) return yearB - yearA;

    const startA = String(a.effective_from ?? "");
    const startB = String(b.effective_from ?? "");
    const startCmp = startB.localeCompare(startA);
    if (startCmp !== 0) return startCmp;

    return readableLeaveType(a.leave_type).localeCompare(readableLeaveType(b.leave_type));
  });

  const totalRows = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * PAGE_SIZE;
  const pagedRows = sortedRows.slice(startIndex, startIndex + PAGE_SIZE);

  function buildPageHref(page: number): string {
    const clamped = Math.max(1, Math.min(totalPages, page));
    return `/leave/balances?page=${clamped}`;
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Leave Balances"
        description="Review yearly leave balances by contract period. Vacation leave may roll over within the same contract period; sick leave resets each contract year."
        backHref="/leave"
      />

      {sortedRows.length === 0 ? (
        <EmptyStateCard>No records found for the selected criteria.</EmptyStateCard>
      ) : (
        <div className={`${dashboardPanelClass} p-5`}>
          <div className="max-h-[560px] overflow-y-auto overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left">
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Employee</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Leave Type</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Year</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Start</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">End</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Entitlement</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Rollover</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Total</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Used</th>
                  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => {
                  const employee = row.employee_id ? employeeById.get(row.employee_id) : undefined;
                  const leaveType = (row.leave_type ?? "").trim().toLowerCase();
                  const isVacation = leaveType === "vacation_leave";
                  const rolloverValue = isVacation ? Number(row.computed_rollover_days ?? 0) : 0;
                  const annualEntitlement = isVacation
                    ? Math.max(0, Number(row.entitlement_days ?? 0))
                    : Number(row.entitlement_days ?? 0);
                  const totalEntitlement = isVacation
                    ? annualEntitlement + rolloverValue
                    : annualEntitlement;

                  return (
                  <tr key={row.id} className="border-b border-neutral-100 align-top">
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      <p className="font-semibold text-neutral-900">{employeeDisplayName(employee)}</p>
                      <p className="text-xs text-neutral-500">
                        {employee?.file_number ? `File #${employee.file_number}` : "File #—"}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{readableLeaveType(row.leave_type)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{row.balance_year ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{formatReadableDate(row.effective_from)}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{formatReadableDate(row.effective_to)}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">{annualEntitlement}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {isVacation ? (
                        rolloverValue > 0 ? (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-neutral-900">{rolloverValue}</span>
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Includes rollover
                            </span>
                          </div>
                        ) : "—"
                      ) : "Not applicable"}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-neutral-900">{totalEntitlement}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{row.used_days ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-neutral-700">{row.remaining_days ?? "—"}</td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>

          {totalRows > PAGE_SIZE ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={buildPageHref(safeCurrentPage - 1)}
                aria-disabled={safeCurrentPage <= 1}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  safeCurrentPage <= 1
                    ? "pointer-events-none border-neutral-200 text-neutral-400"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Previous
              </Link>
              {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                <Link
                  key={page}
                  href={buildPageHref(page)}
                  className={`rounded-lg border px-3 py-1.5 text-sm ${
                    page === safeCurrentPage
                      ? "border-neutral-900 bg-neutral-900 text-white"
                      : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  Page {page}
                </Link>
              ))}
              <Link
                href={buildPageHref(safeCurrentPage + 1)}
                aria-disabled={safeCurrentPage >= totalPages}
                className={`rounded-lg border px-3 py-1.5 text-sm ${
                  safeCurrentPage >= totalPages
                    ? "pointer-events-none border-neutral-200 text-neutral-400"
                    : "border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                }`}
              >
                Next
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </main>
  );
}