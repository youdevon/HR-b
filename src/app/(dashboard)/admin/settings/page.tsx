import PageHeader from "@/components/layout/page-header";

const settings = [
  { id: "s1", title: "Leave Thresholds", description: "Configure warning thresholds for low leave balances." },
  { id: "s2", title: "Contract Expiry Window", description: "Define days before contract expiry to trigger alerts." },
  { id: "s3", title: "Gratuity Review SLA", description: "Set standard review turnaround for gratuity cases." },
];

export default function AdminSettingsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader title="Settings" backHref="/admin" />
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {settings.map((s) => (
            <article key={s.id} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm text-neutral-600">{s.description}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
