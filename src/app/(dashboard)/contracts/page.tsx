import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import EmptyStateCard from "@/components/ui/empty-state-card";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import ClickableTableRow from "@/components/ui/clickable-table-row";
import {
  listContracts,
  normalizeExpiringContractDays,
} from "@/lib/queries/contracts";
import {
  calculateContractMonths,
  calculateGratuityPayment,
  getGlobalGratuityRateSettings,
} from "@/lib/queries/gratuity";
import { getEmployeeById } from "@/lib/queries/employees";
import {
  dashboardButtonSecondaryClass,
  dashboardFieldClass,
  dashboardHeaderActionPrimaryClass,
  dashboardHeaderActionSecondaryClass,
  dashboardPanelClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";

type ContractsPageProps = {
  searchParams: Promise<{
    q?: string;
    employeeId?: string;
    status?: string;
    days?: string;
    show?: string;
  }>;
};

type ContractsStatusFilter = "all" | "active" | "expiring" | "expired";

function parseContractsStatus(status: string | undefined): ContractsStatusFilter {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "active") return "active";
  if (normalized === "expiring") return "expiring";
  if (normalized === "expired") return "expired";
  return "all";
}

function parseExpiringDays(value: string | undefined): 30 | 60 | 90 {
  const parsed = Number(value);
  return normalizeExpiringContractDays(Number.isFinite(parsed) ? parsed : undefined);
}

function statusBadgeClass(status: string | null | undefined): string {
  const normalized = (status ?? "").trim().toLowerCase();
  if (normalized === "active") return "bg-emerald-100 text-emerald-800";
  if (normalized === "expiring" || normalized === "pending" || normalized === "warning") return "bg-amber-100 text-amber-800";
  if (normalized === "expired" || normalized === "critical") return "bg-red-100 text-red-800";
  if (normalized === "inactive" || normalized === "resolved") return "bg-neutral-100 text-neutral-700";
  return "bg-neutral-100 text-neutral-700";
}

function formatReadableDate(value: string | null | undefined): string {
  const dateText = (value ?? "").trim();
  if (!dateText) return "—";
  const parsed = new Date(`${dateText}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateText;
  return parsed
    .toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    .replace(",", "");
}

function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function employeeDisplayName(contract: {
  employee_first_name: string | null;
  employee_last_name: string | null;
}): string {
  const fullName = `${contract.employee_first_name ?? ""} ${contract.employee_last_name ?? ""}`.trim();
  return fullName || "Unknown Employee";
}

export default async function ContractsPage({
  searchParams,
}: ContractsPageProps) {
  await requirePermission("contracts.view");
  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];
  const canCreateContract = hasAnyPermissionForContext(profile, permissions, ["contracts.create"]);
  const canViewSalary = hasAnyPermissionForContext(profile, permissions, ["contracts.salary.view"]);
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const employeeId = params?.employeeId?.trim() ?? "";
  const showAllSelected = (params?.show ?? "").trim().toLowerCase() === "all";
  const selectedStatus = parseContractsStatus(params?.status);
  const selectedDays = parseExpiringDays(params?.days);
  const hasSearch = query.length > 0;
  const hasEmployeeFilter = employeeId.length > 0;
  const hasAnyExplicitFilter = showAllSelected || selectedStatus !== "all" || hasSearch;
  const hasClearableFilter =
    showAllSelected || selectedStatus !== "all" || hasSearch || hasEmployeeFilter;
  const isStandardizedContractsView = selectedStatus !== "all" || showAllSelected;
  const selectedEmployee = employeeId ? await getEmployeeById(employeeId) : null;
  const selectedEmployeeName = selectedEmployee
    ? `${selectedEmployee.first_name ?? ""} ${selectedEmployee.last_name ?? ""}`.trim()
    : "";
  const gratuityRates = await getGlobalGratuityRateSettings();

  const contracts = employeeId || hasAnyExplicitFilter
    ? await listContracts({
        query,
        employeeId: employeeId || undefined,
        status: showAllSelected ? "all" : selectedStatus,
        days: selectedStatus === "expiring" ? selectedDays : undefined,
      })
    : [];

  return (
    <main className="space-y-6">
      <PageHeader
        title="Contracts"
        description={
          employeeId
            ? `Contracts for ${selectedEmployeeName || employeeId}.`
            : "Manage employee contracts and contract status."
        }
        backHref="/dashboard"
        actions={
          <>
            <Link href="/contracts?show=all" className={dashboardHeaderActionSecondaryClass}>
              Show All
            </Link>
            {canCreateContract ? (
              <Link
                href={employeeId ? `/contracts/new?employeeId=${employeeId}` : "/contracts/new"}
                className={dashboardHeaderActionPrimaryClass}
              >
                New Contract
              </Link>
            ) : null}
          </>
        }
      />

      <section className={dashboardPanelClass}>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={
              employeeId ? `/contracts?status=active&employeeId=${employeeId}` : "/contracts?status=active"
            }
            className={`inline-flex h-10 items-center rounded-xl border px-3 text-sm font-medium transition ${
              selectedStatus === "active"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            Active Contracts
          </Link>
          <Link
            href={
              employeeId
                ? `/contracts?status=expiring&days=90&employeeId=${employeeId}`
                : "/contracts?status=expiring&days=90"
            }
            className={`inline-flex h-10 items-center rounded-xl border px-3 text-sm font-medium transition ${
              selectedStatus === "expiring"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            Expiring Contracts
          </Link>
          <Link
            href={employeeId ? `/contracts?status=expired&employeeId=${employeeId}` : "/contracts?status=expired"}
            className={`inline-flex h-10 items-center rounded-xl border px-3 text-sm font-medium transition ${
              selectedStatus === "expired"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            Expired Contracts
          </Link>
        </div>
      </section>

      <div className={dashboardPanelClass}>
        <form className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {selectedStatus !== "all" ? (
            <input type="hidden" name="status" value={selectedStatus} />
          ) : null}
          {selectedStatus === "expiring" ? <input type="hidden" name="days" value={selectedDays} /> : null}
          {showAllSelected ? <input type="hidden" name="show" value="all" /> : null}
          {employeeId ? <input type="hidden" name="employeeId" value={employeeId} /> : null}
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search contract or employee name..."
            className={dashboardFieldClass}
          />
          {selectedStatus === "expiring" ? (
            <select
              name="days"
              defaultValue={String(selectedDays)}
              className={dashboardFieldClass}
            >
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          ) : null}
          <button type="submit" className={dashboardButtonSecondaryClass}>
            Search
          </button>
          {hasClearableFilter ? (
            <Link href="/contracts" className={dashboardButtonSecondaryClass}>
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {!employeeId && !hasAnyExplicitFilter ? (
        <EmptyStateCard>Use search or select a filter to view records.</EmptyStateCard>
      ) : contracts.length === 0 ? (
        <EmptyStateCard>No records found for the selected criteria.</EmptyStateCard>
      ) : (
        <div className={dashboardPanelClass}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  {isStandardizedContractsView ? (
                    <>
                      <th className={dashboardTableHeadCellClass}>Contract #</th>
                      <th className={dashboardTableHeadCellClass}>Employee Name</th>
                      <th className={dashboardTableHeadCellClass}>Start Date</th>
                      <th className={dashboardTableHeadCellClass}>End Date</th>
                      <th className={dashboardTableHeadCellClass}>Salary</th>
                      <th className={dashboardTableHeadCellClass}>Gratuity</th>
                    </>
                  ) : (
                    <>
                      <th className={dashboardTableHeadCellClass}>Contract #</th>
                      <th className={dashboardTableHeadCellClass}>Title</th>
                      <th className={dashboardTableHeadCellClass}>Type</th>
                      <th className={dashboardTableHeadCellClass}>Status</th>
                      <th className={dashboardTableHeadCellClass}>Lifecycle</th>
                      <th className={dashboardTableHeadCellClass}>Employee</th>
                      <th className={dashboardTableHeadCellClass}>Start</th>
                      <th className={dashboardTableHeadCellClass}>End</th>
                      <th className={dashboardTableHeadCellClass}>Department</th>
                      <th className={dashboardTableHeadCellClass}>Job Title</th>
                      {canViewSalary ? <th className={dashboardTableHeadCellClass}>Salary</th> : null}
                      <th className={dashboardTableHeadCellClass}>Gratuity</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => {
                  const contractMonths = calculateContractMonths(contract.start_date, contract.end_date);
                  const gratuityEstimate = calculateGratuityPayment({
                    monthlySalary: Number(contract.salary_amount ?? 0),
                    contractMonths,
                    isGratuityEligible: contract.is_gratuity_eligible === true,
                    gratuityRatePercent: gratuityRates.gratuity_rate_percent,
                    governmentTaxPercent: gratuityRates.government_tax_percent,
                  });
                  const gratuityDisplay = contract.is_gratuity_eligible === true
                    ? gratuityEstimate.is_eligible
                      ? `Eligible — ${formatCurrency(gratuityEstimate.net_gratuity_payable)}`
                      : "Eligible — Unable to calculate"
                    : "Not applicable";

                  return (
                    <ClickableTableRow key={contract.id} href={`/contracts/${contract.id}`}>
                      <td className={dashboardTableCellClass}>{contract.contract_number ?? "—"}</td>
                      {isStandardizedContractsView ? (
                        <>
                          <td className={dashboardTableCellClass}>{employeeDisplayName(contract)}</td>
                          <td className={dashboardTableCellClass}>{formatReadableDate(contract.start_date)}</td>
                          <td className={dashboardTableCellClass}>{formatReadableDate(contract.end_date)}</td>
                          <td className={dashboardTableCellClass}>
                            {canViewSalary ? formatCurrency(contract.salary_amount) : "—"}
                          </td>
                          <td className={dashboardTableCellClass}>{gratuityDisplay}</td>
                        </>
                      ) : (
                        <>
                          <td className={dashboardTableCellClass}>{contract.contract_title ?? "—"}</td>
                          <td className={dashboardTableCellClass}>{contract.contract_type ?? "—"}</td>
                          <td className={dashboardTableCellClass}>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(contract.effective_contract_status)}`}>
                              {contract.effective_contract_status}
                            </span>
                          </td>
                          <td className={dashboardTableCellClass}>{employeeDisplayName(contract)}</td>
                          <td className={dashboardTableCellClass}>{formatReadableDate(contract.start_date)}</td>
                          <td className={dashboardTableCellClass}>{formatReadableDate(contract.end_date)}</td>
                          <td className={dashboardTableCellClass}>{contract.department ?? "—"}</td>
                          <td className={dashboardTableCellClass}>{contract.job_title ?? "—"}</td>
                          {canViewSalary ? (
                            <td className={dashboardTableCellClass}>
                              {formatCurrency(contract.salary_amount)}
                            </td>
                          ) : null}
                          <td className={dashboardTableCellClass}>
                            {contract.is_gratuity_eligible ? "Eligible" : "Not applicable"}
                          </td>
                        </>
                      )}
                    </ClickableTableRow>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}