import { notFound } from "next/navigation";
import { getContractById } from "@/lib/queries/contracts";

type ContractDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ContractDetailPage({
  params,
}: ContractDetailPageProps) {
  const { id } = await params;
  const contract = await getContractById(id);

  if (!contract) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Contract Details
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review contract information and status.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Overview</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-neutral-500">Contract Number</dt>
              <dd className="font-medium text-neutral-900">
                {contract.contract_number ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Title</dt>
              <dd className="font-medium text-neutral-900">
                {contract.contract_title ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Type</dt>
              <dd className="font-medium text-neutral-900">
                {contract.contract_type ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Status</dt>
              <dd className="font-medium text-neutral-900">
                {contract.contract_status ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Dates</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-neutral-500">Start Date</dt>
              <dd className="font-medium text-neutral-900">
                {contract.start_date ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">End Date</dt>
              <dd className="font-medium text-neutral-900">
                {contract.end_date ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Created At</dt>
              <dd className="font-medium text-neutral-900">
                {contract.created_at ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Role and Department</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-neutral-500">Department</dt>
              <dd className="font-medium text-neutral-900">
                {contract.department ?? "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Job Title</dt>
              <dd className="font-medium text-neutral-900">
                {contract.job_title ?? "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Compensation</h2>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="text-neutral-500">Salary</dt>
              <dd className="font-medium text-neutral-900">
                {contract.salary_amount != null
                  ? `${contract.salary_amount} ${contract.salary_frequency ?? ""}`.trim()
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-neutral-500">Gratuity Eligible</dt>
              <dd className="font-medium text-neutral-900">
                {contract.is_gratuity_eligible ? "Yes" : "No"}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}