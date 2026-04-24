export default function ExpiringContractsPage() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Expiring contracts</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Contracts nearing end date will appear here.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">This page will be connected to expiring contract data.</p>
      </section>
    </main>
  );
}
