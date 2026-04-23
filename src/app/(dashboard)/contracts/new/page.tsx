import Link from "next/link";
import ContractForm from "@/components/domain/contracts/contract-form";

export default function NewContractPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                New Contract
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Create a new employee contract record.
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                The form validates with Zod; persistence can be connected to Supabase when you wire a save path.
              </p>
            </div>
            <Link
              href="/contracts"
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back to Contracts
            </Link>
          </div>
        </section>

        <ContractForm submitLabel="Create Contract" showPersistenceHint />
      </div>
    </main>
  );
}
