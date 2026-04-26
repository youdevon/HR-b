import Link from "next/link";
import type { ReactNode } from "react";
import PageHeader from "@/components/layout/page-header";
import { getDashboardSession } from "@/lib/auth/guards";
import { hasPermissionForContext, isOfficer, profileDisplayName } from "@/lib/auth/permissions";
import { loadSelfServiceProfile } from "@/lib/queries/profile";
import { formatLeaveType } from "@/lib/queries/leave";
import { calculateContractGratuityEstimate } from "@/lib/queries/gratuity";
import { redirect } from "next/navigation";

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "active" || normalized === "approved") return "bg-emerald-100 text-emerald-800";
  if (normalized === "pending" || normalized === "warning") return "bg-amber-100 text-amber-800";
  if (normalized === "expired" || normalized === "critical" || normalized === "rejected") return "bg-red-100 text-red-800";
  if (normalized === "returned") return "bg-blue-100 text-blue-800";
  return "bg-neutral-100 text-neutral-700";
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatReadableDate(dateValue: string | null | undefined): string {
  const value = (dateValue ?? "").trim();
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  })
    .format(date)
    .replace(",", "");
}

function calculateAge(dateOfBirth: string | null | undefined): number | null {
  const value = (dateOfBirth ?? "").trim();
  if (!value) return null;
  const birthDate = new Date(value);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function normalizeValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <p className="text-sm font-semibold text-neutral-700">{label}</p>
      <p className="text-sm text-neutral-900">{normalizeValue(value)}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      {description ? <p className="mt-1 text-sm text-neutral-600">{description}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StandardProfileGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
      {children}
    </div>
  );
}

type LeaveBalancePeriodGroup = {
  key: string;
  contractId: string | null;
  balanceYear: string | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  vacationLeave: {
    entitlement: number | null;
    used: number | null;
    remaining: number | null;
  } | null;
  sickLeave: {
    entitlement: number | null;
    used: number | null;
    remaining: number | null;
  } | null;
  isCurrentPeriod: boolean;
};

function toNumberOrNull(value: number | null | undefined): number | null {
  return typeof value === "number" ? value : null;
}

function buildLeaveBalanceGroups(
  balances: Array<{
    contract_id?: string | null;
    leave_type: string | null;
    balance_year: number | null;
    effective_from: string | null;
    effective_to: string | null;
    entitlement_days: number | null;
    used_days: number | null;
    remaining_days: number | null;
  }>
): LeaveBalancePeriodGroup[] {
  const groups = new Map<string, LeaveBalancePeriodGroup>();
  const today = new Date().toISOString().slice(0, 10);

  for (const balance of balances) {
    const year = balance.balance_year != null ? String(balance.balance_year) : null;
    const from = balance.effective_from ?? null;
    const to = balance.effective_to ?? null;
    const contractId = balance.contract_id ?? null;
    const key = `${contractId ?? "no_contract"}|${year ?? "no_year"}|${from ?? "no_from"}|${to ?? "no_to"}`;
    const leaveType = (balance.leave_type ?? "").toLowerCase();

    if (!groups.has(key)) {
      const isCurrentPeriod = Boolean(from && to && from <= today && to >= today);
      groups.set(key, {
        key,
        contractId,
        balanceYear: year,
        effectiveFrom: from,
        effectiveTo: to,
        vacationLeave: null,
        sickLeave: null,
        isCurrentPeriod,
      });
    }

    const group = groups.get(key);
    if (!group) continue;

    const metrics = {
      entitlement: toNumberOrNull(balance.entitlement_days),
      used: toNumberOrNull(balance.used_days),
      remaining: toNumberOrNull(balance.remaining_days),
    };

    if (leaveType === "vacation_leave") group.vacationLeave = metrics;
    if (leaveType === "sick_leave") group.sickLeave = metrics;
  }

  return [...groups.values()].sort((a, b) => {
    return (a.effectiveFrom ?? "").localeCompare(b.effectiveFrom ?? "");
  });
}

export default async function ProfilePage() {
  const auth = await getDashboardSession();
  if (!auth) redirect("/login");

  const profile = auth.profile;
  const permissions = auth.permissions;
  const displayName = profile ? profileDisplayName(profile) : "User";
  const userEmail = profile?.email ?? auth.user.email ?? null;

  const canViewContracts = hasPermissionForContext(profile, permissions, "profile.contracts.view");
  const canViewLeave = hasPermissionForContext(profile, permissions, "profile.leave.view");
  const isSelfOfficer = isOfficer(profile);
  const canViewSalary = hasPermissionForContext(profile, permissions, "profile.salary.view") || isSelfOfficer;
  const canViewGratuity = hasPermissionForContext(profile, permissions, "profile.gratuity.view") || isSelfOfficer;

  const data = await loadSelfServiceProfile(profile?.employee_id, userEmail);
  const { employee, contracts, leaveBalances, leaveTransactions } = data;
  const employeeFullName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim()
    : "";
  const profileTitle = employeeFullName || "My Profile";

  const dateOfBirthDisplay = employee?.date_of_birth
    ? (() => {
        const age = calculateAge(employee.date_of_birth);
        const readable = formatReadableDate(employee.date_of_birth);
        return age != null ? `${readable} (Age ${age})` : readable;
      })()
    : "—";

  const leaveBalanceGroups = buildLeaveBalanceGroups(leaveBalances);
  const todayDateText = new Date().toISOString().slice(0, 10);
  const hasCurrentPeriod = leaveBalanceGroups.some((group) => group.isCurrentPeriod);

  const currentActiveContract = contracts.find((contract) => {
    const start = (contract.start_date ?? "").trim();
    const end = (contract.end_date ?? "").trim();
    if (!start || !end) return false;
    return start <= todayDateText && todayDateText <= end;
  });

  const sortedLeaveTransactions = [...leaveTransactions].sort((a, b) =>
    (b.start_date ?? "").localeCompare(a.start_date ?? "")
  );
  const orderedLeaveBalanceGroups = [...leaveBalanceGroups].sort((a, b) => {
    const aFrom = a.effectiveFrom ?? "";
    const bFrom = b.effectiveFrom ?? "";
    const aTo = a.effectiveTo ?? "";
    const bTo = b.effectiveTo ?? "";

    if (hasCurrentPeriod) {
      if (a.isCurrentPeriod !== b.isCurrentPeriod) return a.isCurrentPeriod ? -1 : 1;

      const aIsPrevious = Boolean(aTo && aTo < todayDateText);
      const bIsPrevious = Boolean(bTo && bTo < todayDateText);
      if (aIsPrevious !== bIsPrevious) return aIsPrevious ? -1 : 1;

      const aIsFuture = Boolean(aFrom && aFrom > todayDateText);
      const bIsFuture = Boolean(bFrom && bFrom > todayDateText);
      if (aIsFuture !== bIsFuture) return aIsFuture ? 1 : -1;

      if (aIsPrevious && bIsPrevious) {
        return bFrom.localeCompare(aFrom);
      }
      if (aIsFuture && bIsFuture) {
        return aFrom.localeCompare(bFrom);
      }
    }

    return bFrom.localeCompare(aFrom);
  });

  const currentVacationGroup = leaveBalanceGroups.find(
    (group) => group.isCurrentPeriod && Boolean(group.vacationLeave)
  );
  const rolloverContributorKeys = new Set<string>();
  if (currentVacationGroup) {
    const canComputeByContractId =
      Boolean(currentVacationGroup.contractId) &&
      leaveBalances.some((balance) => Boolean(balance.contract_id));
    const canComputeByCurrentContractWindow =
      !currentVacationGroup.contractId &&
      Boolean(currentActiveContract?.start_date) &&
      Boolean(currentActiveContract?.end_date) &&
      leaveBalances.every((balance) => !balance.contract_id);

    for (const candidate of leaveBalanceGroups) {
      if (!candidate.vacationLeave) continue;
      if (candidate.key === currentVacationGroup.key) continue;
      if ((candidate.effectiveFrom ?? "") >= (currentVacationGroup.effectiveFrom ?? "")) continue;

      if (canComputeByContractId && candidate.contractId === currentVacationGroup.contractId) {
        if (Number(candidate.vacationLeave.remaining ?? 0) > 0) rolloverContributorKeys.add(candidate.key);
      } else if (canComputeByCurrentContractWindow) {
        const contractStart = currentActiveContract?.start_date ?? "";
        const contractEnd = currentActiveContract?.end_date ?? "";
        const candidateStart = candidate.effectiveFrom ?? "";
        const candidateEnd = candidate.effectiveTo ?? "";
        const isInsideCurrentContract =
          Boolean(candidateStart) &&
          Boolean(candidateEnd) &&
          contractStart <= candidateStart &&
          candidateEnd <= contractEnd;
        if (isInsideCurrentContract && Number(candidate.vacationLeave.remaining ?? 0) > 0) {
          rolloverContributorKeys.add(candidate.key);
        }
      }
    }
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title={profileTitle}
        description="View your personal HR information, contract details, and leave balances."
        actions={
          <Link
            href="/profile/change-password"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-900 transition hover:bg-neutral-50"
          >
            Change Password
          </Link>
        }
      />

      {!employee ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
          <p className="font-semibold">No linked employee record</p>
          <p className="mt-1">
            Your user account is not linked to an employee record. Please contact HR.
          </p>
        </section>
      ) : null}

      <SectionCard title="Account Information">
        <StandardProfileGrid>
          <ReadOnlyField label="Name" value={displayName} />
          <ReadOnlyField label="Email" value={userEmail} />
          <ReadOnlyField label="Phone" value={profile?.phone_number} />
          <ReadOnlyField label="Role" value={profile?.role_name ?? profile?.role_code} />
        </StandardProfileGrid>
      </SectionCard>

      {employee ? (
        <SectionCard title="Personal Information">
          <StandardProfileGrid>
            <ReadOnlyField label="Employee Number" value={employee.employee_number} />
            <ReadOnlyField label="File Number" value={employee.file_number} />
            <ReadOnlyField label="First Name" value={employee.first_name} />
            <ReadOnlyField label="Middle Name" value={employee.middle_name} />
            <ReadOnlyField label="Last Name" value={employee.last_name} />
            <ReadOnlyField label="Preferred Name" value={employee.preferred_name} />
            <ReadOnlyField label="Date of Birth" value={dateOfBirthDisplay} />
            <ReadOnlyField label="Department" value={employee.department} />
            <ReadOnlyField label="Division" value={employee.division} />
            <ReadOnlyField label="Job Title" value={employee.job_title} />
            <ReadOnlyField
              label="Employment Status"
              value={employee.employment_status}
            />
            <ReadOnlyField label="Employment Type" value={employee.employment_type} />
            <ReadOnlyField label="Hire Date" value={formatReadableDate(employee.hire_date)} />
            <ReadOnlyField label="Work Email" value={employee.work_email} />
            <ReadOnlyField label="Personal Email" value={employee.personal_email} />
            <ReadOnlyField label="Mobile Number" value={employee.mobile_number} />
            <ReadOnlyField label="ID Number" value={employee.id_number} />
            <ReadOnlyField label="BIR Number" value={employee.bir_number} />
            <ReadOnlyField label="File Location" value={employee.file_location} />
          </StandardProfileGrid>
        </SectionCard>
      ) : null}

      {employee && canViewContracts ? (
        <SectionCard
          title="Contract Information"
          description="Your contract history and current terms."
        >

          {contracts.length === 0 ? (
            <p className="mt-4 text-sm text-neutral-500">No contracts found.</p>
          ) : (
            <div className="mt-4 space-y-4">
              {contracts.map((contract) => {
                const position = employee.job_title || contract.job_title || null;
                const gratuityEstimate = contract.is_gratuity_eligible
                  ? calculateContractGratuityEstimate({
                      monthlySalary: contract.salary_amount,
                      startDate: contract.start_date,
                      endDate: contract.end_date,
                      isGratuityEligible: true,
                    })
                  : null;

                return (
                  <div
                    key={contract.id}
                    className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">
                        {contract.contract_number ?? "—"}
                      </span>
                      {contract.contract_title ? (
                        <span className="text-sm text-neutral-600">
                          — {contract.contract_title}
                        </span>
                      ) : null}
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                          contract.effective_contract_status
                        )}`}
                      >
                        {contract.effective_contract_status}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                      <ReadOnlyField label="Position" value={position} />
                      <ReadOnlyField label="Contract Number" value={contract.contract_number} />
                      <ReadOnlyField label="Contract Type" value={contract.contract_type} />
                      <ReadOnlyField
                        label="Contract Status"
                        value={contract.effective_contract_status}
                      />
                      <ReadOnlyField
                        label="Start Date"
                        value={formatReadableDate(contract.start_date)}
                      />
                      <ReadOnlyField
                        label="End Date"
                        value={formatReadableDate(contract.end_date)}
                      />
                      {canViewSalary ? (
                        <ReadOnlyField
                          label="Monthly Salary"
                          value={
                            contract.salary_amount != null
                              ? formatCurrency(contract.salary_amount)
                              : "—"
                          }
                        />
                      ) : null}
                      {canViewSalary ? (
                        <ReadOnlyField label="Salary Frequency" value={contract.salary_frequency} />
                      ) : null}
                      {canViewSalary ? (
                        <ReadOnlyField
                          label="Allowances"
                          value={
                            typeof (contract as Record<string, unknown>).allowance_amount === "number"
                              ? formatCurrency(
                                  (contract as Record<string, unknown>).allowance_amount as number
                                )
                              : typeof (contract as Record<string, unknown>).allowances === "number"
                                ? formatCurrency(
                                    (contract as Record<string, unknown>).allowances as number
                                  )
                                : "—"
                          }
                        />
                      ) : null}
                      {canViewGratuity ? (
                        <ReadOnlyField
                          label="Estimated Gratuity Payment"
                          value={
                            gratuityEstimate?.is_eligible
                              ? contract.salary_amount != null &&
                                contract.start_date &&
                                contract.end_date
                                ? formatCurrency(gratuityEstimate.net_gratuity_payable)
                                : "Unable to calculate"
                              : "Not applicable"
                          }
                        />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      ) : null}

      {employee && canViewLeave ? (
        <>
          <SectionCard
            title="Leave Balance"
            description="Your current leave entitlements and remaining days."
          >

            {leaveBalanceGroups.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No leave balances found.</p>
            ) : (
              <div className="space-y-3">
                {orderedLeaveBalanceGroups.map((group, index) => {
                  const isCurrentVacationPeriod = group.isCurrentPeriod && Boolean(group.vacationLeave);
                  const canComputeRolloverByContractId =
                    isCurrentVacationPeriod &&
                    Boolean(group.contractId) &&
                    leaveBalances.some((balance) => Boolean(balance.contract_id));
                  const canComputeRolloverByCurrentContractWindow =
                    isCurrentVacationPeriod &&
                    !group.contractId &&
                    Boolean(currentActiveContract?.start_date) &&
                    Boolean(currentActiveContract?.end_date) &&
                    leaveBalances.every((balance) => !balance.contract_id);

                  const previousVacationGroups = leaveBalanceGroups.filter((candidate) => {
                    if (!candidate.vacationLeave) return false;
                    if (candidate.key === group.key) return false;
                    if ((candidate.effectiveFrom ?? "") >= (group.effectiveFrom ?? "")) return false;

                    if (canComputeRolloverByContractId) {
                      return candidate.contractId === group.contractId;
                    }

                    if (canComputeRolloverByCurrentContractWindow) {
                      const contractStart = currentActiveContract?.start_date ?? "";
                      const contractEnd = currentActiveContract?.end_date ?? "";
                      const candidateStart = candidate.effectiveFrom ?? "";
                      const candidateEnd = candidate.effectiveTo ?? "";
                      return (
                        Boolean(candidateStart) &&
                        Boolean(candidateEnd) &&
                        contractStart <= candidateStart &&
                        candidateEnd <= contractEnd
                      );
                    }

                    return false;
                  });

                  const vacationRollover = previousVacationGroups.reduce(
                    (total, candidate) => total + Math.max(0, Number(candidate.vacationLeave?.remaining ?? 0)),
                    0
                  );
                  const canShowRollover =
                    isCurrentVacationPeriod &&
                    (canComputeRolloverByContractId || canComputeRolloverByCurrentContractWindow);
                  const currentVacationEntitlement = Number(group.vacationLeave?.entitlement ?? 0);
                  const currentVacationUsed = Number(group.vacationLeave?.used ?? 0);
                  const currentVacationAvailable =
                    currentVacationEntitlement + (canShowRollover ? vacationRollover : 0) - currentVacationUsed;

                  const periodLabel = group.effectiveFrom && group.effectiveTo
                    ? `${formatReadableDate(group.effectiveFrom)} to ${formatReadableDate(group.effectiveTo)}`
                    : group.balanceYear
                      ? group.balanceYear
                      : "";
                  return (
                  <div
                    key={group.key}
                    className={`rounded-xl p-4 ${
                      group.isCurrentPeriod
                        ? "border border-neutral-300 bg-neutral-50 shadow-sm"
                        : "border border-neutral-200 bg-white"
                    }`}
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-neutral-900">
                        <span>Leave Balance</span>
                        {periodLabel ? <span className="text-neutral-400">—</span> : null}
                        {periodLabel ? <span>{periodLabel}</span> : null}
                      </h3>
                      {group.isCurrentPeriod ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                          Current Period
                        </span>
                      ) : group.effectiveFrom && group.effectiveFrom > todayDateText ? (
                        <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                          Future Period
                        </span>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-xl border border-neutral-200 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900">Vacation Leave</p>
                          {canShowRollover && vacationRollover > 0 ? (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              Includes rollover from previous contract years
                            </span>
                          ) : null}
                        </div>
                        {group.vacationLeave ? (
                          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {canShowRollover ? (
                              <>
                                <ReadOnlyField label="Vacation Entitlement" value={currentVacationEntitlement} />
                                <ReadOnlyField label="Vacation Rollover" value={vacationRollover} />
                                <ReadOnlyField label="Vacation Used" value={currentVacationUsed} />
                                <ReadOnlyField label="Vacation Available" value={currentVacationAvailable} />
                              </>
                            ) : (
                              <>
                                <ReadOnlyField label="Entitlement" value={group.vacationLeave.entitlement ?? 0} />
                                <ReadOnlyField label="Used" value={group.vacationLeave.used ?? 0} />
                                <ReadOnlyField label="Remaining" value={group.vacationLeave.remaining ?? 0} />
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-neutral-500">Not recorded</p>
                        )}
                        {!group.isCurrentPeriod && rolloverContributorKeys.has(group.key) ? (
                          <p className="mt-2 text-xs text-neutral-500">Rollover carried forward</p>
                        ) : null}
                      </div>

                      <div className="rounded-xl border border-neutral-200 bg-white p-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900">Sick Leave</p>
                          <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                            Resets each contract year
                          </span>
                        </div>
                        {group.sickLeave ? (
                          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <ReadOnlyField label="Entitlement" value={group.sickLeave.entitlement ?? 0} />
                            <ReadOnlyField label="Used" value={group.sickLeave.used ?? 0} />
                            <ReadOnlyField label="Remaining" value={group.sickLeave.remaining ?? 0} />
                          </div>
                        ) : (
                          <p className="mt-2 text-sm text-neutral-500">Not recorded</p>
                        )}
                      </div>
                    </div>
                  </div>
                );})}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Leave History"
            description="Your recent leave requests and their status."
          >

            {sortedLeaveTransactions.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No leave history recorded.</p>
            ) : (
              <div className="space-y-3">
                {sortedLeaveTransactions.map((txn) => (
                  <div key={txn.id} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                      <ReadOnlyField label="Leave Type" value={formatLeaveType(txn.leave_type)} />
                      <ReadOnlyField
                        label="Start Date"
                        value={formatReadableDate(txn.start_date)}
                      />
                      <ReadOnlyField label="End Date" value={formatReadableDate(txn.end_date)} />
                      <ReadOnlyField label="Total Days" value={txn.days ?? txn.total_days ?? "—"} />
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-neutral-700">Status</p>
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                            txn.status
                          )}`}
                        >
                          {txn.status ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </>
      ) : null}

    </main>
  );
}
