import Link from "next/link";
import { revalidatePath } from "next/cache";
import PageHeader from "@/components/layout/page-header";
import { markContractExpiryReviewed } from "@/lib/queries/alerts";
import {
  listExpiringContracts,
  normalizeExpiringContractDays,
} from "@/lib/queries/contracts";

type ExpiringContractsPageProps = {
  searchParams: Promise<{
    days?: string;
  }>;
};

function formatDate(dateText: string | null): string {
  if (!dateText) return "—";
  const [yearText, monthText, dayText] = dateText.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return dateText;
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function expiryBadge(daysToExpiry: number) {
  if (daysToExpiry <= 7) {
    return "bg-red-100 text-red-700 ring-1 ring-red-200";
  }
  return "bg-orange-100 text-orange-700 ring-1 ring-orange-200";
}

export default async function ExpiringContractsPage({
  searchParams,
}: ExpiringContractsPageProps) {
  const sp = await searchParams;
  const days = normalizeExpiringContractDays(Number(sp.days));

  async function markContractExpiryReviewedAction(formData: FormData) {
    "use server";
    const contractId = String(formData.get("contractId") ?? "").trim();
    if (!contractId) return;
    await markContractExpiryReviewed(contractId);
    revalidatePath("/contracts/expiring");
    revalidatePath("/dashboard");
    revalidatePath("/alerts/active");
  }

  const contracts = await listExpiringContracts(days);

  return (
    <main className="space-y-6">
      <PageHeader
        title={`Contracts Expiring in ${days} Days`}
        description="Contracts nearing their end date based on the selected range."
        backHref="/contracts"
        actions={
          <>
            <Link
              href="/contracts/expiring?days=30"
              className={`rounded-lg border px-3 py-1.5 ${
                days === 30
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              30 days
            </Link>
            <Link
              href="/contracts/expiring?days=60"
              className={`rounded-lg border px-3 py-1.5 ${
                days === 60
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              60 days
            </Link>
            <Link
              href="/contracts/expiring?days=90"
              className={`rounded-lg border px-3 py-1.5 ${
                days === 90
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-300 hover:bg-neutral-50"
              }`}
            >
              90 days
            </Link>
          </>
        }
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 text-sm text-neutral-700 shadow-sm">
        Reviewed items stay on this page for reference, but their active alert is cleared.
      </section>

      <section className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
        {contracts.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Contract #</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                  <th className="px-4 py-3">Days to expiry</th>
                  <th className="px-4 py-3">Reviewed</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Job title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className={
                      contract.days_to_expiry <= 7
                        ? "bg-red-50/50 hover:bg-red-50"
                        : "hover:bg-neutral-50"
                    }
                  >
                    <td className="whitespace-nowrap px-4 py-3">
                      {[contract.employee_first_name, contract.employee_last_name]
                        .filter(Boolean)
                        .join(" ") || contract.employee_id || "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{contract.contract_number ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/contracts/${contract.id}`} className="hover:underline">
                        {contract.contract_title ?? "—"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{contract.contract_type ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{contract.effective_contract_status}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(contract.start_date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(contract.end_date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${expiryBadge(
                            contract.days_to_expiry
                          )}`}
                        >
                          {contract.days_to_expiry}d
                        </span>
                        <span className="ml-2 text-xs text-neutral-500">remaining</span>
                      </>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {contract.is_reviewed ? (
                        <span
                          aria-label="Mark contract expiry as reviewed"
                          title="Reviewed"
                          className="inline-flex h-5 w-5 items-center justify-center rounded border border-emerald-700 bg-emerald-700 text-[11px] font-bold text-white"
                        >
                          ✓
                        </span>
                      ) : (
                        <form action={markContractExpiryReviewedAction}>
                          <input type="hidden" name="contractId" value={contract.id} />
                          <button
                            type="submit"
                            aria-label="Mark contract expiry as reviewed"
                            title="Mark as reviewed"
                            className="inline-flex h-5 w-5 items-center justify-center rounded border border-neutral-400 bg-white text-transparent transition hover:border-neutral-600 hover:bg-neutral-50"
                          >
                            ✓
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{contract.department ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{contract.job_title ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-12 text-center text-sm text-neutral-600">
            No contracts found for this range.
          </div>
        )}
      </section>
    </main>
  );
}
