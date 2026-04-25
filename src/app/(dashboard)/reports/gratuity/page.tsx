import PageHeader from "@/components/layout/page-header";
export default function Page() {
  return (
    <main className="space-y-6">
      <PageHeader
        title="Gratuity report"
        description="Gratuity calculations, approvals, and payment readiness for finance and HR."
        backHref="/reports"
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">This report will be connected to gratuity data.</p>
      </section>
    </main>
  );
}
