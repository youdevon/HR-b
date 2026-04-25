import PageHeader from "@/components/layout/page-header";

export default function ContractRenewalsPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        title="Contract renewals"
        description="Upcoming renewals and renewal pipeline will appear here."
        backHref="/contracts"
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">This page will be connected to renewal data.</p>
      </section>
    </main>
  );
}
