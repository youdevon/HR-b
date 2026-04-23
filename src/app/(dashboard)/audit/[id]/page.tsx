type Props = { params: { id: string } };

export default function AuditDetailPage({ params }: Props) {
  const event = { actor: "admin@company.com", action: "Updated compensation", entity: "comp_1", occurred_at: "2026-04-22 09:45", details: "Salary updated from 11500 to 12000." };
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-4xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Audit Event {params.id}</h1></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 text-sm space-y-2">
        <p><strong>Actor:</strong> {event.actor}</p>
        <p><strong>Action:</strong> {event.action}</p>
        <p><strong>Entity:</strong> {event.entity}</p>
        <p><strong>Occurred At:</strong> {event.occurred_at}</p>
        <p><strong>Details:</strong> {event.details}</p>
      </section>
    </div></main>
  );
}
