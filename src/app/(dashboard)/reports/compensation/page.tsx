import PageHeader from "@/components/layout/page-header";
export default function Page() {
  return (
    <main className="space-y-6">
      <PageHeader
        title="Compensation report"
        description="Salary history and compensation trends for reporting and payroll review."
        backHref="/reports"
      />

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">This report will be connected to compensation data.</p>
      </section>
    </main>
  );
}
