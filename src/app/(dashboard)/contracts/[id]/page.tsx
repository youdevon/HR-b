import {
  getContractById,
  applyContractLifecycleAction,
  getEffectiveContractStatus,
  calculateContractYearCount,
  calculateTotalMonthlyAllowances,
  listContractAllowancesByContractId,
} from "@/lib/queries/contracts";
import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { assertPermission, getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  calculateContractMonths,
  calculateGratuityPayment,
  DEFAULT_GOVERNMENT_TAX_PERCENT,
  DEFAULT_GRATUITY_RATE_PERCENT,
} from "@/lib/queries/gratuity";
import {
  formatLeaveType,
  listContractLeaveBalanceSummary,
} from "@/lib/queries/leave";

type ContractDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function formatReadableDate(dateText: string | null | undefined): string {
  const value = (dateText ?? "").trim();
  if (!value) return "—";
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function redirectWithActionMessage(
  contractId: string,
  action: string,
  nextStatus: "success" | "error",
  nextMessage: string
): never {
  const qs = new URLSearchParams();
  qs.set("action", action);
  qs.set("status", nextStatus);
  qs.set("message", nextMessage);
  redirect(`/contracts/${contractId}?${qs.toString()}`);
}

async function renewContractServerAction(contractId: string, formData: FormData) {
  "use server";
  await assertPermission("contracts.renew");
  try {
    await applyContractLifecycleAction({
      id: contractId,
      action: "renew_contract",
      start_date: String(formData.get("start_date") ?? ""),
      end_date: String(formData.get("end_date") ?? ""),
      renewal_notes: String(formData.get("renewal_notes") ?? ""),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to record renewal dates.";
    redirectWithActionMessage(contractId, "renew", "error", errorMessage);
  }

  revalidatePath(`/contracts/${contractId}`);
  revalidatePath("/contracts");
  revalidatePath("/contracts/expiring");
  redirectWithActionMessage(
    contractId,
    "renew",
    "success",
    "Renewal dates recorded successfully."
  );
}

export default async function ContractDetailPage({
  params,
  searchParams,
}: ContractDetailPageProps) {
  await requirePermission("contracts.view");
  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];
  const canEditContract = hasAnyPermissionForContext(profile, permissions, ["contracts.edit"]);
  const canRenewContract = hasAnyPermissionForContext(profile, permissions, ["contracts.renew"]);
  const canViewSalary = hasAnyPermissionForContext(profile, permissions, ["contracts.salary.view"]);
  const { id } = await params;
  const sp = await searchParams;
  const status = firstString(sp.status);
  const message = firstString(sp.message);

  const contract = await getContractById(id);
  if (!contract) notFound();
  const leaveBalanceSummary = await listContractLeaveBalanceSummary({
    employee_id: contract.employee_id,
    contract_id: contract.id,
    contract_start_date: contract.start_date,
    contract_end_date: contract.end_date,
  });
  const allowances = await listContractAllowancesByContractId(contract.id);
  const effectiveStatus = getEffectiveContractStatus(contract);
  const contractYears = calculateContractYearCount(contract.start_date, contract.end_date);
  const annualVacationEntitlement = Number(contract.vacation_leave_days ?? 0);
  const annualSickEntitlement = Number(contract.sick_leave_days ?? 0);
  const totalVacationPlanningEntitlement = annualVacationEntitlement * contractYears;
  const contractMonths = calculateContractMonths(contract.start_date, contract.end_date);
  const gratuityEstimate = calculateGratuityPayment({
    monthlySalary: Number(contract.salary_amount ?? 0),
    contractMonths,
    isGratuityEligible: contract.is_gratuity_eligible === true,
    gratuityRatePercent: DEFAULT_GRATUITY_RATE_PERCENT,
    governmentTaxPercent: DEFAULT_GOVERNMENT_TAX_PERCENT,
  });
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  const totalMonthlyAllowances = calculateTotalMonthlyAllowances(allowances);
  const totalMonthlyCompensation =
    Number(contract.salary_amount ?? 0) + Number(totalMonthlyAllowances ?? 0);

  const renewContractAction = renewContractServerAction.bind(null, id);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Contract Overview"
        description="Lifecycle controls for this employee contract."
        backHref="/contracts"
        actions={
          <>
            {contract.employee_id ? (
              <Link
                href={`/employees/${contract.employee_id}`}
                className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
              >
                View Employee Profile
              </Link>
            ) : null}
            {canEditContract ? (
              <Link
                href={`/contracts/${id}/edit`}
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Edit Contract
              </Link>
            ) : null}
          </>
        }
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        {contract.employee_id ? (
          <p className="mb-4 text-sm text-neutral-700">
            This contract belongs to{" "}
            <span className="font-medium text-neutral-900">
              {contract.employee_name ?? "the linked employee"}
            </span>
            .
          </p>
        ) : null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Employee" value={contract.employee_name ?? contract.employee_id ?? "—"} />
          <Info label="Contract #" value={contract.contract_number ?? "—"} />
          <Info label="Title" value={contract.contract_title ?? "—"} />
          <Info label="Status" value={effectiveStatus} />
          <Info label="Start Date" value={formatReadableDate(contract.start_date)} />
          <Info label="End Date" value={formatReadableDate(contract.end_date)} />
          <Info
            label="Gratuity Eligibility"
            value={contract.is_gratuity_eligible ? "Eligible" : "Not applicable"}
          />
          <Info label="Contract Duration (Months)" value={String(contractMonths)} />
          <Info
            label="Estimated Net Gratuity"
            value={
              gratuityEstimate.is_eligible
                ? formatCurrency(gratuityEstimate.net_gratuity_payable)
                : "Not applicable"
            }
          />
          <Info label="Vacation Leave Days" value={String(Number(contract.vacation_leave_days ?? 0))} />
          <Info label="Sick Leave Days" value={String(Number(contract.sick_leave_days ?? 0))} />
          {canViewSalary ? (
            <Info label="Salary" value={formatCurrency(Number(contract.salary_amount ?? 0))} />
          ) : (
            <Info label="Salary" value="Restricted" />
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Allowances</h2>
        {allowances.length === 0 ? (
          <p className="mt-2 text-sm text-neutral-600">No allowances recorded for this contract.</p>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-600">
                  <tr>
                    <th className="px-3 py-2">Allowance Name</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Frequency</th>
                    <th className="px-3 py-2">Taxable</th>
                    <th className="px-3 py-2">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {allowances.map((allowance) => (
                    <tr key={allowance.id}>
                      <td className="px-3 py-2">{allowance.allowance_name}</td>
                      <td className="px-3 py-2">
                        {canViewSalary ? formatCurrency(Number(allowance.allowance_amount ?? 0)) : "Restricted"}
                      </td>
                      <td className="px-3 py-2">{allowance.allowance_frequency}</td>
                      <td className="px-3 py-2">{allowance.is_taxable ? "Yes" : "No"}</td>
                      <td className="px-3 py-2">{allowance.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Info
                label="Total Monthly Allowances"
                value={canViewSalary ? formatCurrency(totalMonthlyAllowances) : "Restricted"}
              />
              <Info
                label="Total Monthly Compensation"
                value={canViewSalary ? formatCurrency(totalMonthlyCompensation) : "Restricted"}
              />
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Leave entitlement summary</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Leave entitlements are annual per contract year. Vacation and sick leave reset each contract year with no rollover.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info
            label="Vacation Leave"
            value={`${annualVacationEntitlement} days per year`}
          />
          <Info
            label="Sick Leave"
            value={`${annualSickEntitlement} days per year`}
          />
          <Info
            label="Contract Period"
            value={`${formatReadableDate(contract.start_date)} to ${formatReadableDate(contract.end_date)}`}
          />
          <Info
            label="Total Vacation Planning Entitlement"
            value={`${annualVacationEntitlement} × ${contractYears} = ${totalVacationPlanningEntitlement} days`}
          />
        </div>
        {leaveBalanceSummary.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-600">No leave balance records found for this contract yet.</p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {leaveBalanceSummary.map((balance) => (
              <Info
                key={balance.id}
                label={`${formatLeaveType(balance.leave_type)} (${balance.balance_year ?? "Year"})`}
                value={`Entitlement ${Number(balance.entitlement_days ?? 0)} • Used ${Number(balance.used_days ?? 0)} • Remaining ${Number(balance.remaining_days ?? 0)} • ${formatReadableDate(balance.effective_from)} to ${formatReadableDate(balance.effective_to)}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Gratuity estimate breakdown</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Formula: Monthly Salary × Contract Months ×{" "}
          {gratuityEstimate.gratuity_rate_decimal.toFixed(2)} ×{" "}
          {gratuityEstimate.payable_after_tax_decimal.toFixed(2)}
        </p>
        {contractMonths === 0 ? (
          <p className="mt-2 text-xs text-amber-700">
            Contract period is less than one full month, so gratuity uses 0 contract months.
          </p>
        ) : null}
        {!gratuityEstimate.is_eligible ? (
          <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
            {gratuityEstimate.ineligible_reason ?? "Gratuity is not applicable to this contract."}
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Info label="Monthly Salary" value={formatCurrency(Number(contract.salary_amount ?? 0))} />
            <Info label="Contract Months" value={String(contractMonths)} />
            <Info label="Total Salary Earned" value={formatCurrency(gratuityEstimate.total_salary_earned)} />
            <Info label="Gratuity Before Tax" value={formatCurrency(gratuityEstimate.gratuity_before_tax)} />
            <Info
              label={`Government Tax Deduction (${gratuityEstimate.government_tax_percent}%)`}
              value={formatCurrency(gratuityEstimate.government_tax_deduction)}
            />
            <Info
              label="Net Gratuity Payable"
              value={formatCurrency(gratuityEstimate.net_gratuity_payable)}
            />
          </div>
        )}
      </section>

      {message ? (
        <section
          className={`rounded-2xl border p-4 text-sm ${
            status === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {message}
        </section>
      ) : null}

      {canRenewContract ? (
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Add Renewal Dates</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Use this section to record the new contract period after renewal has been confirmed administratively.
          </p>
          <form action={renewContractAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="space-y-1 text-sm text-neutral-700">
              <span className="font-medium text-neutral-900">Renewal Start Date</span>
              <input
                name="start_date"
                type="date"
                required
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="space-y-1 text-sm text-neutral-700">
              <span className="font-medium text-neutral-900">Renewal End Date</span>
              <input
                name="end_date"
                type="date"
                required
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </label>
            <div className="md:col-span-2 space-y-1">
              <label htmlFor="renewal_notes" className="text-sm font-medium text-neutral-900">
                Renewal Notes
              </label>
              <p className="text-xs text-neutral-600">
                Add any notes about the renewal decision, approval, or supporting information.
              </p>
              <textarea
                id="renewal_notes"
                name="renewal_notes"
                defaultValue={contract.renewal_notes ?? ""}
                placeholder="Renewal notes"
                rows={4}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <button type="submit" className="w-fit rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              Add Renewal Dates
            </button>
          </form>
        </section>
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}