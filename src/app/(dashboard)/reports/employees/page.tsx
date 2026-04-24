export default function Page() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Employees report</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Headcount, department mix, and employment status summaries for HR planning.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">This report will be connected to employee data.</p>
      </section>
    </main>
  );
}
