export type AuditEvent = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  occurred_at: string;
};

type Props = {
  title: string;
  events: AuditEvent[];
};

export default function AuditHistoryPanel({ title, events }: Props) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="mt-4 space-y-3">
        {events.map((event) => (
          <div key={event.id} className="rounded-xl border border-neutral-200 p-3">
            <p className="text-sm font-medium text-neutral-900">{event.action}</p>
            <p className="text-xs text-neutral-600">{event.entity}</p>
            <p className="mt-1 text-xs text-neutral-500">{event.actor} - {event.occurred_at}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
