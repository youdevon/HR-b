import Link from "next/link";
import { listExpiredContracts } from "@/lib/queries/contracts";

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

function expiredBadge(daysExpired: number) {
  if (daysExpired <= 7) {
    return "bg-neutral-200 text-neutral-700 ring-1 ring-neutral-300";
  }
  return "bg-red-100 text-red-700 ring-1 ring-red-200";
}

export default async function ExpiredContractsPage() {
  const contracts = await listExpiredContracts();

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Expired Contracts
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Contracts where end date is before today.
        </p>
      </div>

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
                  <th className="px-4 py-3">Days expired</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Job title</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {contracts.map((contract) => (
                  <tr
                    key={contract.id}
                    className={
                      contract.days_expired > 7
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
                    <td className="whitespace-nowrap px-4 py-3">{contract.contract_status ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(contract.start_date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{formatDate(contract.end_date)}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${expiredBadge(
                          contract.days_expired
                        )}`}
                      >
                        {contract.days_expired}d
                      </span>
                      <span className="ml-2 text-xs text-neutral-500">expired</span>
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
            No expired contracts found.
          </div>
        )}
      </section>
    </main>
  );
}