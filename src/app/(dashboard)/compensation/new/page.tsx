import Link from "next/link";
import CompensationForm from "@/components/domain/compensation/compensation-form";

export default function NewCompensationPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">New Compensation</h1>
        <Link href="/compensation/current" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm">Back</Link>
      </section>
      <CompensationForm submitLabel="Create Compensation" />
    </div></main>
  );
}
