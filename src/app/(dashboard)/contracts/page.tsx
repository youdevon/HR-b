import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import ClickableTableRow from "@/components/ui/clickable-table-row";
import { listContracts, listContractsByEmployeeId } from "@/lib/queries/contracts";
import { getEmployeeById } from "@/lib/queries/employees";

type ContractsPageProps = {
  searchParams: Promise<{
    q?: string;
    employeeId?: string;
    status?: string;
    show?: string;
  }>;
};

function isActiveStatus(status: string | undefined): boolean {
  return (status ?? "").trim().toLowerCase() === "active";
}

function lifecycleStatus(contract: {
  renewal_status: string | null;
  confirmation_status: string | null;
  renewal_due_date: string | null;
  probation_end_date: string | null;
}): string {
  if (contract.renewal_status?.toLowerCase() === "renewed") return "Renewed";
  if (contract.confirmation_status?.toLowerCase() === "confirmed") return "Confirmed";
  if (contract.renewal_due_date && contract.renewal_status?.toLowerCase() !== "renewed") {
    const due = new Date(contract.renewal_due_date).getTime();
    if (!Number.isNaN(due) && due < Date.now()) return "Overdue Renewal";
    return "Renewal Due";
  }
  if (
    contract.probation_end_date &&
    contract.confirmation_status?.toLowerCase() !== "confirmed"
  ) {
    return "In Probation";
  }
  return "Active Lifecycle";
}

export default async function ContractsPage({
  searchParams,
}: ContractsPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const employeeId = params?.employeeId?.trim() ?? "";
  const showAllSelected = (params?.show ?? "").trim().toLowerCase() === "all";
  const selectedStatus = isActiveStatus(params?.status) ? "active" : "all";
  const hasSearch = query.length > 0;
  const hasAnyExplicitFilter = showAllSelected || selectedStatus === "active" || hasSearch;
  const selectedEmployee = employeeId ? await getEmployeeById(employeeId) : null;
  const selectedEmployeeName = selectedEmployee
    ? `${selectedEmployee.first_name ?? ""} ${selectedEmployee.last_name ?? ""}`.trim()
    : "";

  const contracts = employeeId
    ? await listContractsByEmployeeId(employeeId, query)
    : hasAnyExplicitFilter
      ? await listContracts({
          query,
          status: selectedStatus === "active" ? "active" : "all",
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
        <Link
          href={employeeId ? `/contracts/new?employeeId=${employeeId}` : "/contracts/new"}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white"
        >
          New Contract
        </Link>
        }
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/contracts?show=all"
            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
              showAllSelected
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            Show All
          </Link>
          <Link
            href={
              employeeId ? `/contracts?status=active&employeeId=${employeeId}` : "/contracts?status=active"
            }
            className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition ${
              selectedStatus === "active"
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50"
            }`}
          >
            Active Contracts
          </Link>
          <Link
            href={employeeId ? `/contracts/expiring?days=90&employeeId=${employeeId}` : "/contracts/expiring?days=90"}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Expiring Contracts
          </Link>
          <Link
            href={employeeId ? `/contracts/expired?employeeId=${employeeId}` : "/contracts/expired"}
            className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Expired Contracts
          </Link>
          {hasAnyExplicitFilter ? (
            <Link
              href="/contracts"
              className="ml-1 text-sm font-medium text-neutral-500 underline-offset-4 hover:text-neutral-700 hover:underline"
            >
              Clear
            </Link>
          ) : null}
        </div>
      </section>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <form className="flex flex-col gap-3 sm:flex-row">
          {selectedStatus === "active" ? (
            <input type="hidden" name="status" value="active" />
          ) : null}
          {showAllSelected ? <input type="hidden" name="show" value="all" /> : null}
          {employeeId ? <input type="hidden" name="employeeId" value={employeeId} /> : null}
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search contract or employee name..."
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

      {!employeeId && !hasAnyExplicitFilter ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">
            Use search or select a filter to view contracts.
          </p>
        </div>
      ) : contracts.length === 0 ? (
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
                  <th className="px-3 py-3 font-medium">Lifecycle</th>
                  <th className="px-3 py-3 font-medium">Employee</th>
                  <th className="px-3 py-3 font-medium">Start</th>
                  <th className="px-3 py-3 font-medium">End</th>
                  <th className="px-3 py-3 font-medium">Department</th>
                  <th className="px-3 py-3 font-medium">Job Title</th>
                  <th className="px-3 py-3 font-medium">Salary</th>
                  <th className="px-3 py-3 font-medium">Gratuity</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map((contract) => (
                  <ClickableTableRow key={contract.id} href={`/contracts/${contract.id}`}>
                    <td className="px-3 py-3">{contract.contract_number ?? "—"}</td>
                    <td className="px-3 py-3">{contract.contract_title ?? "—"}</td>
                    <td className="px-3 py-3">{contract.contract_type ?? "—"}</td>
                    <td className="px-3 py-3">{contract.effective_contract_status}</td>
                    <td className="px-3 py-3">{lifecycleStatus(contract)}</td>
                    <td className="px-3 py-3">
                      {[contract.employee_first_name, contract.employee_last_name]
                        .filter(Boolean)
                        .join(" ") || "—"}
                    </td>
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
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}