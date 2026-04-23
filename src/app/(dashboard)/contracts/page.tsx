import Link from "next/link";
import { listContracts } from "@/lib/queries/contracts";

type ContractsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function ContractsPage({
  searchParams,
}: ContractsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const contracts = await listContracts({ query });

  return (
    <main className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Contracts</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage employee contracts and contract status.
          </p>
        </div>

        <Link
          href="/contracts/new"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          New Contract
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <form className="flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search contracts..."
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none ring-0 placeholder:text-neutral-400 focus:border-neutral-400"
          />
          <button
            type="submit"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Search
          </button>
        </form>
      </div>

      {contracts.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">No contracts found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-3 py-3 font-medium">Contract #</th>
                  <th className="px-3 py-3 font-medium">Title</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">Start</th>
                  <th className="px-3 py-3 font-medium">End</th>
                  <th className="px-3 py-3 font-medium">Department</th>
                  <th className="px-3 py-3 font-medium">Job Title</th>
                  <th className="px-3 py-3 font-medium">Salary</th>
                  <th className="px-3 py-3 font-medium">Gratuity</th>
                  <th className="px-3 py-3 font-medium">View</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <tr key={contract.id} className="border-b border-neutral-100">
                    <td className="px-3 py-3">{contract.contract_number ?? "—"}</td>
                    <td className="px-3 py-3">{contract.contract_title ?? "—"}</td>
                    <td className="px-3 py-3">{contract.contract_type ?? "—"}</td>
                    <td className="px-3 py-3">{contract.contract_status ?? "—"}</td>
                    <td className="px-3 py-3">{contract.start_date ?? "—"}</td>
                    <td className="px-3 py-3">{contract.end_date ?? "—"}</td>
                    <td className="px-3 py-3">{contract.department ?? "—"}</td>
                    <td className="px-3 py-3">{contract.job_title ?? "—"}</td>
                    <td className="px-3 py-3">
                      {contract.salary_amount != null
                        ? `${contract.salary_amount} ${contract.salary_frequency ?? ""}`.trim()
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      {contract.is_gratuity_eligible ? "Yes" : "No"}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/contracts/${contract.id}`}
                        className="text-sm font-medium text-neutral-900 underline underline-offset-4"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}