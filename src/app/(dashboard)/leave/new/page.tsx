import Link from "next/link";
import LeaveForm from "@/components/domain/leave/leave-form";

export default function NewLeavePage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">New Leave</h1>
              <p className="mt-1 text-sm text-neutral-600">Create a new leave transaction entry.</p>
            </div>
            <Link
              href="/leave/transactions"
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back to Transactions
            </Link>
          </div>
        </section>

        <LeaveForm submitLabel="Create Leave Transaction" />
      </div>
    </main>
  );
}
