import PageHeader from "@/components/layout/page-header";
import { FormLabel } from "@/components/ui/form-primitives";
import { requirePermission } from "@/lib/auth/guards";
import {
  calculateGratuityPayment,
  getGlobalGratuityRateSettings,
  saveGlobalGratuityRateSettings,
} from "@/lib/queries/gratuity";
import { formHelperClass, formInputClass, formPrimaryButtonClass } from "@/lib/ui/form-styles";
import { redirect } from "next/navigation";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function SettingsGratuityRulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requirePermission("gratuity.rules.manage");
  const params = await searchParams;
  const saved = params.saved === "1";
  const error = typeof params.error === "string" ? params.error : "";
  const rates = await getGlobalGratuityRateSettings();
  const gratuityRatePercent = rates.gratuity_rate_percent;
  const governmentTaxPercent = rates.government_tax_percent;
  const payableAfterTaxPercent = 100 - governmentTaxPercent;
  const gratuityRateDecimal = gratuityRatePercent / 100;
  const governmentTaxDecimal = governmentTaxPercent / 100;
  const payableAfterTaxDecimal = payableAfterTaxPercent / 100;
  const monthlySalary = 3000;
  const contractMonths = 24;
  const example = calculateGratuityPayment({
    monthlySalary,
    contractMonths,
    isGratuityEligible: true,
    gratuityRatePercent,
    governmentTaxPercent,
  });
  const formula = `Monthly Salary × Math.floor(Contract Months) × ${gratuityRateDecimal.toFixed(2)} × ${payableAfterTaxDecimal.toFixed(2)}`;

  async function saveRulesAction(formData: FormData) {
    "use server";
    await requirePermission("gratuity.rules.manage");
    const gratuityRate = Number(formData.get("gratuity_rate_percent") ?? rates.gratuity_rate_percent);
    const governmentTax = Number(formData.get("government_tax_percent") ?? rates.government_tax_percent);
    if (!Number.isFinite(gratuityRate) || gratuityRate < 0 || gratuityRate > 100) {
      redirect("/settings/gratuity-rules?error=Invalid%20gratuity%20rate.%20Use%200%20to%20100.");
    }
    if (!Number.isFinite(governmentTax) || governmentTax < 0 || governmentTax > 100) {
      redirect("/settings/gratuity-rules?error=Invalid%20government%20tax%20rate.%20Use%200%20to%20100.");
    }
    await saveGlobalGratuityRateSettings({
      gratuity_rate_percent: gratuityRate,
      government_tax_percent: governmentTax,
    });
    redirect("/settings/gratuity-rules?saved=1");
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Gratuity Rules"
        description="Manage system-wide gratuity calculation rates used across contracts, reports, and gratuity views."
        backHref="/settings"
      />

      {saved ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Gratuity rules updated successfully.
        </section>
      ) : null}
      {error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </section>
      ) : null}

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Global Calculation Parameters</h2>
          <p className="text-xs text-neutral-500">Saved values are applied globally.</p>
        </div>
        <form action={saveRulesAction} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <FormLabel>Gratuity Rate (%)</FormLabel>
            <input
              type="number"
              name="gratuity_rate_percent"
              min="0"
              max="100"
              step="0.01"
              defaultValue={gratuityRatePercent}
              className={formInputClass}
            />
            <p className={formHelperClass}>
              Portion of total salary used for gratuity.
            </p>
          </label>
          <label className="space-y-1.5">
            <FormLabel>Government Tax Deduction (%)</FormLabel>
            <input
              type="number"
              name="government_tax_percent"
              min="0"
              max="100"
              step="0.01"
              defaultValue={governmentTaxPercent}
              className={formInputClass}
            />
            <p className={formHelperClass}>
              Tax deducted before gratuity payout.
            </p>
          </label>
          <div className="mt-2 md:col-span-2">
            <button type="submit" className={formPrimaryButtonClass}>
              Save Global Rules
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Formula</h2>
        <p className="mt-2 text-sm text-neutral-600">
          <span className="font-medium text-neutral-900">Net Gratuity</span> = {formula}
        </p>
        <div className="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="font-medium text-neutral-900">Gratuity Rate</p>
            <p>{gratuityRatePercent.toFixed(2)}% / {gratuityRateDecimal.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="font-medium text-neutral-900">Government Tax Deduction</p>
            <p>{governmentTaxPercent.toFixed(2)}% / {governmentTaxDecimal.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <p className="font-medium text-neutral-900">Payable After Tax</p>
            <p>{payableAfterTaxPercent.toFixed(2)}% / {payableAfterTaxDecimal.toFixed(2)}</p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-neutral-900">Example</h2>
        <p className="mt-1 text-sm text-neutral-600">Example using monthly salary and contract months.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Monthly Salary</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">{formatCurrency(monthlySalary)}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Contract Months</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">{contractMonths}</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Net Gratuity</p>
            <p className="mt-1 text-lg font-semibold text-emerald-800">
              {formatCurrency(example.net_gratuity_payable)}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
