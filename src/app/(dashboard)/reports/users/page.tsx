export default function Page() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Users report</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Application users, roles, and access-related summaries for administrators.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">This report will be connected to user directory data.</p>
      </section>
    </main>
  );
}
