import { getContractById, applyContractLifecycleAction } from "@/lib/queries/contracts";
import PageHeader from "@/components/layout/page-header";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import {
  calculateContractMonths,
  calculateGratuityPayment,
  DEFAULT_GOVERNMENT_TAX_PERCENT,
  DEFAULT_GRATUITY_RATE_PERCENT,
} from "@/lib/queries/gratuity";

type ContractDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function ContractDetailPage({
  params,
  searchParams,
}: ContractDetailPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const status = firstString(sp.status);
  const message = firstString(sp.message);

  const contract = await getContractById(id);
  if (!contract) notFound();
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

  function redirectWithMessage(
    action: string,
    nextStatus: "success" | "error",
    nextMessage: string
  ): never {
    const qs = new URLSearchParams();
    qs.set("action", action);
    qs.set("status", nextStatus);
    qs.set("message", nextMessage);
    redirect(`/contracts/${id}?${qs.toString()}`);
  }

  async function renewContractAction(formData: FormData) {
    "use server";
    try {
      await applyContractLifecycleAction({
        id,
        action: "renew_contract",
        start_date: String(formData.get("start_date") ?? ""),
        end_date: String(formData.get("end_date") ?? ""),
        renewal_due_date: String(formData.get("renewal_due_date") ?? ""),
        renewal_notes: String(formData.get("renewal_notes") ?? ""),
        hr_owner: String(formData.get("hr_owner") ?? ""),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to renew contract.";
      redirectWithMessage("renew", "error", errorMessage);
    }

    revalidatePath(`/contracts/${id}`);
    revalidatePath("/contracts");
    revalidatePath("/contracts/expiring");
    redirectWithMessage("renew", "success", "Contract renewed successfully.");
  }

  async function confirmEmployeeAction(formData: FormData) {
    "use server";
    try {
      await applyContractLifecycleAction({
        id,
        action: "confirm_employee",
        probation_end_date: String(formData.get("probation_end_date") ?? ""),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to confirm employee.";
      redirectWithMessage("confirm", "error", errorMessage);
    }

    revalidatePath(`/contracts/${id}`);
    revalidatePath("/contracts");
    redirectWithMessage("confirm", "success", "Employee confirmed successfully.");
  }

  async function extendProbationAction(formData: FormData) {
    "use server";
    try {
      await applyContractLifecycleAction({
        id,
        action: "extend_probation",
        probation_end_date: String(formData.get("probation_end_date") ?? ""),
        renewal_notes: String(formData.get("renewal_notes") ?? ""),
        hr_owner: String(formData.get("hr_owner") ?? ""),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to extend probation.";
      redirectWithMessage("probation", "error", errorMessage);
    }

    revalidatePath(`/contracts/${id}`);
    revalidatePath("/contracts");
    redirectWithMessage("probation", "success", "Probation updated successfully.");
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Contract Overview"
        description="Lifecycle controls for this employee contract."
        backHref="/contracts"
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Info label="Employee" value={contract.employee_name ?? contract.employee_id ?? "—"} />
          <Info label="Contract #" value={contract.contract_number ?? "—"} />
          <Info label="Title" value={contract.contract_title ?? "—"} />
          <Info label="Status" value={contract.contract_status ?? "—"} />
          <Info label="Start Date" value={contract.start_date ?? "—"} />
          <Info label="End Date" value={contract.end_date ?? "—"} />
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
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Gratuity estimate breakdown</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Formula: Monthly Salary × Contract Months ×{" "}
          {gratuityEstimate.gratuity_rate_decimal.toFixed(2)} ×{" "}
          {gratuityEstimate.payable_after_tax_decimal.toFixed(2)}
        </p>
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

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Renew Contract</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Enter new contract dates and renewal details.
        </p>
        <form action={renewContractAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input name="start_date" type="date" required className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input name="end_date" type="date" required className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
          <input
            name="renewal_due_date"
            type="date"
            required
            defaultValue={contract.renewal_due_date ?? ""}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="hr_owner"
            defaultValue={contract.hr_owner ?? ""}
            placeholder="HR owner"
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <textarea
            name="renewal_notes"
            defaultValue={contract.renewal_notes ?? ""}
            placeholder="Renewal notes"
            required
            rows={4}
            className="md:col-span-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="w-fit rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
            Renew Contract
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Confirm Employee</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Mark this employee as confirmed for the contract.
        </p>
        <form action={confirmEmployeeAction} className="mt-4 flex flex-wrap gap-3">
          <input
            name="probation_end_date"
            type="date"
            defaultValue={contract.probation_end_date ?? ""}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600">
            Confirm Employee
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900">Extend Probation</h2>
        <p className="mt-1 text-sm text-neutral-600">
          Set a new probation end date and save notes.
        </p>
        <form action={extendProbationAction} className="mt-4 grid gap-3 md:grid-cols-2">
          <input
            name="probation_end_date"
            type="date"
            defaultValue={contract.probation_end_date ?? ""}
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            name="hr_owner"
            defaultValue={contract.hr_owner ?? ""}
            placeholder="HR owner"
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <textarea
            name="renewal_notes"
            defaultValue={contract.renewal_notes ?? ""}
            placeholder="Probation notes"
            rows={4}
            className="md:col-span-2 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="w-fit rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
            Extend Probation
          </button>
        </form>
      </section>
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