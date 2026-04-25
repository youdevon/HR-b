import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { getEmployeeById } from "@/lib/queries/employees";
import {
  formatLeaveType,
  getCurrentSickLeaveBalance,
  listLeaveBalancesByEmployeeId,
  listLeaveTransactionsByEmployeeId,
  summarizeVacationLeaveWithinPeriod,
} from "@/lib/queries/leave";
import { listRecordsByEmployeeId } from "@/lib/queries/records";
import { getCurrentActiveContract, listContractsByEmployeeId } from "@/lib/queries/contracts";
import {
  getCurrentFileMovementByEmployeeId,
  listFileMovementsByEmployeeId,
} from "@/lib/queries/file-movements";
import { listAuditLogsByEmployeeId, summarizeChangedFields } from "@/lib/queries/audit";
import { calculateContractGratuityEstimate } from "@/lib/queries/gratuity";

type EmployeeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function display(value: string | null | undefined) {
  return value && value.trim() ? value : "—";
}

function formatAuditWhen(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function dateScore(value: string | null | undefined): number {
  if (!value) return Number.NEGATIVE_INFINITY;
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  await requirePermission("employees.view");
  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];
  const canEditEmployee = hasAnyPermissionForContext(profile, permissions, ["employees.edit"]);
  const canCreateContract = hasAnyPermissionForContext(profile, permissions, ["contracts.create"]);
  const canCreateLeave = hasAnyPermissionForContext(profile, permissions, ["leave.create"]);
  const canMoveFile = hasAnyPermissionForContext(profile, permissions, ["files.move", "employee.file.move"]);
  const canCreateRecord = hasAnyPermissionForContext(profile, permissions, ["records.create"]);
  const canViewEmployeeId = hasAnyPermissionForContext(profile, permissions, ["employee.id.view"]);
  const canViewBir = hasAnyPermissionForContext(profile, permissions, ["employee.bir.view"]);
  const canViewFileDetails = hasAnyPermissionForContext(profile, permissions, ["employee.file.view", "files.view"]);
  const { id } = await params;
  const [
    employee,
    contracts,
    leaveBalances,
    leaveTransactions,
    records,
    fileMovements,
    currentFileMovement,
    employeeAudits,
  ] =
    await Promise.all([
    getEmployeeById(id),
    listContractsByEmployeeId(id),
    listLeaveBalancesByEmployeeId(id),
    listLeaveTransactionsByEmployeeId(id),
    listRecordsByEmployeeId(id),
    listFileMovementsByEmployeeId(id),
    getCurrentFileMovementByEmployeeId(id),
    listAuditLogsByEmployeeId(id),
  ]);

  if (!employee) {
    notFound();
  }

  const fullName = `${employee.first_name ?? ""} ${
    employee.last_name ?? ""
  }`.trim();
  const pendingLeaveCount = leaveTransactions.filter(
    (leave) => leave.approval_status === "pending"
  ).length;
  const activeLeaveCount = leaveTransactions.filter(
    (leave) => leave.approval_status === "approved"
  ).length;
  const totalLeaveBalance = leaveBalances.reduce(
    (total, balance) => total + Number(balance.remaining_days ?? 0),
    0
  );
  const leaveBalancesByYear = leaveBalances.reduce<Record<string, typeof leaveBalances>>(
    (acc, balance) => {
      const key = String(balance.balance_year ?? "Unknown");
      if (!acc[key]) acc[key] = [];
      acc[key].push(balance);
      return acc;
    },
    {}
  );
  const todayDateText = new Date().toISOString().slice(0, 10);
  const currentActiveContract = getCurrentActiveContract(contracts);
  const vacationSummary = summarizeVacationLeaveWithinPeriod(
    leaveBalances,
    currentActiveContract?.start_date,
    currentActiveContract?.end_date
  );
  const currentSickBalance = getCurrentSickLeaveBalance(
    leaveBalances,
    todayDateText,
    currentActiveContract?.start_date,
    currentActiveContract?.end_date
  );
  const preferredContract = [...contracts].sort((a, b) => {
    const activePriority =
      (b.effective_contract_status === "active" ? 1 : 0) -
      (a.effective_contract_status === "active" ? 1 : 0);
    if (activePriority !== 0) return activePriority;

    const startDiff = dateScore(b.start_date) - dateScore(a.start_date);
    if (startDiff !== 0) return startDiff;

    return dateScore(b.created_at) - dateScore(a.created_at);
  })[0] ?? null;
  const contractOverviewHref = preferredContract
    ? `/contracts/${preferredContract.id}`
    : null;

  return (
    <main className="space-y-6">
      <PageHeader
        title={fullName || "Employee Profile"}
        description={`Employee #${employee.employee_number?.trim() ? employee.employee_number : "Not assigned"} • File #${display(employee.file_number)}`}
        backHref="/employees"
        actions={
          canEditEmployee ? (
            <Link
              href={`/employees/${employee.id}/edit`}
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Edit Employee
            </Link>
          ) : null
        }
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {contractOverviewHref ? (
            <Link
              href={contractOverviewHref}
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Contract Overview
            </Link>
          ) : (
            <span className="rounded-xl border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-500">
              No contract available
            </span>
          )}
          {canCreateContract ? (
            <Link href={`/contracts/new?employeeId=${employee.id}`} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">Add Contract</Link>
          ) : null}
          {canCreateLeave ? (
            <Link href={`/leave/new?employeeId=${employee.id}`} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">Add Leave Record</Link>
          ) : null}
          {canMoveFile ? (
            <Link href={`/file-movements/new?employeeId=${employee.id}`} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">Move Physical File</Link>
          ) : null}
          {canCreateRecord ? (
            <Link href={`/records/new?employeeId=${employee.id}`} className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50">Add Record</Link>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="File Number" value={employee.file_number} />
          <SummaryCard label="Status" value={employee.employment_status} />
          <SummaryCard
            label="Current File Location"
            value={currentFileMovement?.current_location ?? employee.file_location}
          />
          <SummaryCard
            label="Current File Holder"
            value={currentFileMovement?.current_holder ?? "—"}
          />
          <SummaryCard
            label="Leave Balance"
            value={`${totalLeaveBalance} days`}
          />
          <SummaryCard
            label="Pending Leave"
            value={`${pendingLeaveCount} request(s)`}
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="Personal Info">
          <InfoRow label="First Name" value={employee.first_name} />
          <InfoRow label="Last Name" value={employee.last_name} />
          <InfoRow label="Date of Birth" value={employee.date_of_birth} />
          <InfoRow label="Personal Email" value={employee.personal_email} />
          <InfoRow label="Mobile Number" value={employee.mobile_number} />
        </InfoCard>

        <InfoCard title="Work Info">
          <InfoRow label="Department" value={employee.department} />
          <InfoRow label="Division" value={employee.division} />
          <InfoRow label="Job Title" value={employee.job_title} />
          <InfoRow label="Employment Type" value={employee.employment_type} />
          <InfoRow label="Hire Date" value={employee.hire_date} />
          <InfoRow label="Work Email" value={employee.work_email} />
        </InfoCard>

        <InfoCard title="Identification">
          <InfoRow label="ID Type" value={employee.id_type} />
          <InfoRow label="ID Number" value={canViewEmployeeId ? employee.id_number : "Restricted"} />
          <InfoRow
            label="Other ID Description"
            value={employee.other_id_description}
          />
          <InfoRow label="BIR Number" value={canViewBir ? employee.bir_number : "Restricted"} />
        </InfoCard>

        <InfoCard title="Physical File Info">
          <InfoRow label="File Status" value={canViewFileDetails ? employee.file_status : "Restricted"} />
          <InfoRow
            label="Current File Location"
            value={canViewFileDetails ? currentFileMovement?.current_location ?? employee.file_location : "Restricted"}
          />
          <InfoRow
            label="Current File Holder"
            value={canViewFileDetails ? currentFileMovement?.current_holder : "Restricted"}
          />
          <InfoRow label="File Notes" value={canViewFileDetails ? employee.file_notes : "Restricted"} />
        </InfoCard>
      </section>

      <section
        id="contracts-overview"
        className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Contracts</h2>
          <Link
            href={`/contracts?employeeId=${employee.id}`}
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>

        {contracts.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Gratuity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {contracts.map((contract) => {
                  const gratuity = calculateContractGratuityEstimate({
                    monthlySalary: contract.salary_amount,
                    startDate: contract.start_date,
                    endDate: contract.end_date,
                    isGratuityEligible: contract.is_gratuity_eligible === true,
                  });
                  return (
                    <tr key={contract.id} className="hover:bg-neutral-50">
                    <td className="max-w-[240px] truncate px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/contracts/${contract.id}`} className="hover:underline">
                        {display(contract.contract_title)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.contract_number)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.contract_type)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.effective_contract_status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.start_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.end_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {contract.is_gratuity_eligible ? (
                        <div className="text-xs text-neutral-700">
                          <p className="font-medium">Gratuity: Eligible</p>
                          <p className="text-neutral-600">
                            {formatCurrency(gratuity.net_gratuity_payable)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-xs text-neutral-600">
                          <p className="font-medium">Gratuity: Not applicable</p>
                          <p>Not applicable</p>
                        </div>
                      )}
                    </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No contracts found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Leave Balances
          </h2>
          <Link
            href={`/leave/transactions?employeeId=${employee.id}`}
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <SummaryCard
            label="Total Vacation Leave"
            value={`${vacationSummary.remaining} days`}
          />
          <SummaryCard
            label="Total Sick Leave"
            value={`${Number(currentSickBalance?.remaining_days ?? 0)} days`}
          />
          <SummaryCard label="Approved Leave Records" value={`${activeLeaveCount}`} />
          <SummaryCard label="Pending Approvals" value={`${pendingLeaveCount}`} />
        </div>
        <div className="mt-3 grid gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-700 md:grid-cols-2">
          <div>
            <p className="font-semibold text-neutral-900">Vacation Leave</p>
            <p>Entitlement: {vacationSummary.entitlement}</p>
            <p>Used: {vacationSummary.used}</p>
            <p>Remaining: {vacationSummary.remaining}</p>
            <p>
              Contract Period: {currentActiveContract?.start_date ?? "—"} -{" "}
              {currentActiveContract?.end_date ?? "—"}
            </p>
          </div>
          <div>
            <p className="font-semibold text-neutral-900">Sick Leave</p>
            <p>Current year entitlement: {Number(currentSickBalance?.entitlement_days ?? 0)}</p>
            <p>Used: {Number(currentSickBalance?.used_days ?? 0)}</p>
            <p>Remaining: {Number(currentSickBalance?.remaining_days ?? 0)}</p>
            <p>
              Effective: {display(currentSickBalance?.effective_from ?? null)} -{" "}
              {display(currentSickBalance?.effective_to ?? null)}
            </p>
            <p className="mt-1 text-neutral-600">
              Sick leave resets each contract year and does not roll over.
            </p>
          </div>
        </div>

        {leaveBalances.length ? (
          <div className="mt-4 space-y-4">
            {Object.entries(leaveBalancesByYear)
              .sort(([a], [b]) => Number(b) - Number(a))
              .map(([year, balances]) => (
                <div key={year} className="overflow-x-auto rounded-xl border border-neutral-200">
                  <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm font-semibold text-neutral-800">
                    Contract Year {year}
                  </div>
                  <table className="min-w-full divide-y divide-neutral-200 text-sm">
                    <thead className="bg-neutral-50">
                      <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Entitlement</th>
                        <th className="px-4 py-3">Used</th>
                        <th className="px-4 py-3">Remaining</th>
                        <th className="px-4 py-3">Effective</th>
                        <th className="px-4 py-3">Rollover</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                      {balances.map((balance) => (
                        <tr key={balance.id} className="hover:bg-neutral-50">
                          <td className="whitespace-nowrap px-4 py-3">
                            {formatLeaveType(balance.leave_type)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {balance.entitlement_days ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {balance.used_days ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                            {balance.remaining_days ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {display(balance.effective_from)} - {display(balance.effective_to)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            {formatLeaveType(balance.leave_type).toLowerCase().includes("sick")
                              ? "No (resets yearly)"
                              : "Within active contract"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No leave balances found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Recent Leave Transactions
          </h2>
          {canCreateLeave ? (
            <Link
              href={`/leave/new?employeeId=${employee.id}`}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              Add Leave Record
            </Link>
          ) : null}
        </div>

        {leaveTransactions.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Dates</th>
                  <th className="px-4 py-3">Days</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Return</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {leaveTransactions.slice(0, 5).map((leave) => (
                  <tr key={leave.id} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/leave/${leave.id}`} className="hover:underline">
                        {formatLeaveType(leave.leave_type)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(leave.start_date)} - {display(leave.end_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {leave.total_days ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(leave.approval_status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(leave.return_to_work_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No leave transactions found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Record Keeping</h2>
          <Link
            href={`/records?employeeId=${employee.id}`}
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>

        {records.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {records.map((record) => (
                  <tr key={record.id} className="hover:bg-neutral-50">
                    <td className="max-w-[260px] truncate px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/records/${record.id}`} className="hover:underline">
                        {display(record.record_title)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(record.record_type)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(record.record_category)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(record.record_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(record.reference_number)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(record.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No records found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Physical File Movements
          </h2>
          <div className="flex gap-3">
            {canMoveFile ? (
              <Link
                href={`/file-movements/new?employeeId=${employee.id}`}
                className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
              >
                Move File
              </Link>
            ) : null}
            <Link
              href={`/file-movements?employeeId=${employee.id}`}
              className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
            >
              View all
            </Link>
          </div>
        </div>

        {fileMovements.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Current Holder</th>
                  <th className="px-4 py-3">Current Location</th>
                  <th className="px-4 py-3">File #</th>
                  <th className="px-4 py-3">From Custodian</th>
                  <th className="px-4 py-3">To Custodian</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date Sent</th>
                  <th className="px-4 py-3">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {fileMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      {display(movement.current_holder)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.current_location)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.file_number)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.from_custodian)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.to_custodian)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.movement_status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.date_sent)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <Link href={`/file-movements/${movement.id}`} className="font-medium text-neutral-900 hover:underline">
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No physical file movements found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Audit History</h2>
            <p className="text-sm text-neutral-600">
              Timeline of updates made to this employee file.
            </p>
          </div>
          <Link
            href={`/audit/activity?employee_id=${employee.id}`}
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            Open filtered activity
          </Link>
        </div>

        {employeeAudits.length ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {employeeAudits.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col rounded-2xl border border-neutral-200/90 bg-neutral-50/40 p-4 shadow-sm ring-1 ring-neutral-100/80 transition hover:border-neutral-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex rounded-lg bg-white px-2 py-1 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200">
                    {entry.action_type}
                  </span>
                  <time className="shrink-0 text-xs font-medium text-neutral-500">
                    {formatAuditWhen(entry.event_timestamp ?? entry.created_at)}
                  </time>
                </div>
                <p className="mt-3 text-sm font-medium leading-snug text-neutral-900">
                  {entry.action_summary}
                </p>
                <p className="mt-2 text-xs text-neutral-600">
                  <span className="font-medium text-neutral-700">By:</span>{" "}
                  {entry.performed_by_display_name}
                </p>
                <p className="mt-3 text-xs text-neutral-600">
                  <span className="font-medium text-neutral-700">Changed fields:</span>{" "}
                  {summarizeChangedFields(entry.changed_fields)}
                </p>
                <div className="mt-4 border-t border-neutral-200/80 pt-3">
                  <Link
                    href={`/audit/${entry.id}?return_to=${encodeURIComponent(`/employees/${employee.id}`)}`}
                    className="text-sm font-semibold text-neutral-900 underline-offset-2 hover:underline"
                  >
                    View audit detail
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">No audit entries for this employee yet.</p>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-900">
        {display(value)}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <dl className="mt-4 divide-y divide-neutral-100">{children}</dl>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-900 sm:col-span-2">
        {display(value)}
      </dd>
    </div>
  );
}