import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  calculateGratuityPayment,
  DEFAULT_GOVERNMENT_TAX_PERCENT,
  DEFAULT_GRATUITY_RATE_PERCENT,
  listGratuityRules,
} from "@/lib/queries/gratuity";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function toPercent(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(100, Math.max(0, parsed));
}

export default async function GratuityRulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const gratuityRatePercent = toPercent(
    firstString(sp.gratuity_rate_percent),
    DEFAULT_GRATUITY_RATE_PERCENT
  );
  const governmentTaxPercent = toPercent(
    firstString(sp.government_tax_percent),
    DEFAULT_GOVERNMENT_TAX_PERCENT
  );
  const payableAfterTaxPercent = 100 - governmentTaxPercent;
  const gratuityRateDecimal = gratuityRatePercent / 100;
  const governmentTaxDecimal = governmentTaxPercent / 100;
  const payableAfterTaxDecimal = payableAfterTaxPercent / 100;
  const rules = await listGratuityRules();
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

  return (
    <main className="space-y-6">
      <div className="space-y-6">
        <PageHeader
          title="Gratuity rules"
          description="Gratuity is controlled by each contract's Eligible for Gratuity checkbox. If unchecked, gratuity is not applicable."
          backHref="/gratuity/calculations"
          actions={
            <Link
              href="/gratuity/calculations"
              className="inline-flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Calculations
            </Link>
          }
        />

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Eligibility</h2>
          <p className="mt-2 text-sm text-neutral-600">
            <span className="font-medium text-neutral-900">Eligible for Gratuity</span> checkbox on the contract determines whether
            calculation applies. Short-term contracts can simply be left unchecked.
          </p>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">Gratuity Calculation Parameters</h2>
            <p className="text-xs text-neutral-500">Adjust percentages to preview impact on the example.</p>
          </div>
          <form className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Gratuity Rate (%)</span>
              <input
                type="number"
                name="gratuity_rate_percent"
                min="0"
                max="100"
                step="0.01"
                defaultValue={gratuityRatePercent}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-neutral-500">
                Portion of total earned salary used for gratuity (shown as decimal {gratuityRateDecimal.toFixed(2)}).
              </p>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Government Tax Deduction (%)</span>
              <input
                type="number"
                name="government_tax_percent"
                min="0"
                max="100"
                step="0.01"
                defaultValue={governmentTaxPercent}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <p className="text-xs text-neutral-500">
                Tax deducted from gratuity before payout (decimal {governmentTaxDecimal.toFixed(2)}). Employee receives {payableAfterTaxPercent.toFixed(2)}% ({payableAfterTaxDecimal.toFixed(2)}).
              </p>
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Update Example
              </button>
            </div>
          </form>
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
          <h2 className="text-lg font-semibold text-neutral-900">Formula</h2>
          <p className="mt-2 text-sm text-neutral-600">
            <span className="font-medium text-neutral-900">Net Gratuity</span> = {formula}
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Contract months are rounded down to whole months before gratuity is calculated.
          </p>
          <div className="mt-4 grid gap-3 text-sm text-neutral-700 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="font-medium text-neutral-900">Step 1: Total Salary Earned</p>
              <p className="mt-1">Monthly Salary × Number of Months</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="font-medium text-neutral-900">Step 2: Gratuity Before Tax</p>
              <p className="mt-1">Total Salary Earned × {gratuityRatePercent.toFixed(2)}%</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="font-medium text-neutral-900">Step 3: Government Tax Deduction</p>
              <p className="mt-1">
                Gratuity Before Tax × {governmentTaxPercent.toFixed(2)}%
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <p className="font-medium text-neutral-900">Step 4: Net Gratuity Payable</p>
              <p className="mt-1">
                Gratuity Before Tax × {payableAfterTaxPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-neutral-900">Example calculation</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Example based on contract salary and contract period.
          </p>
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
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Total Salary Earned</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {formatCurrency(example.total_salary_earned)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Gratuity Before Tax</p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {formatCurrency(example.gratuity_before_tax)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Government Tax Deduction ({governmentTaxPercent.toFixed(2)}%)
              </p>
              <p className="mt-1 text-lg font-semibold text-neutral-900">
                {formatCurrency(example.government_tax_deduction)}
              </p>
            </div>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">
                Net Gratuity Payable
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-800">
                {formatCurrency(example.net_gratuity_payable)}
              </p>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="border-b border-neutral-200 px-4 py-3 text-sm text-neutral-600">
            Database-configured rules (informational). Formula above is the active calculation standard.
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Rule</th>
                  <th className="px-4 py-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rules.map((r) => (
                  <tr key={r.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{r.rule_name ?? "—"}</td>
                    <td className="max-w-xl px-4 py-3 text-neutral-700">{r.description ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rules.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">No gratuity rules configured yet.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
