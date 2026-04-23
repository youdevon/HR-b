import AuditHistoryPanel from "@/components/domain/audit/audit-history-panel";

const events = [
  { id: "aud_1", actor: "admin@company.com", action: "Updated compensation", entity: "comp_1", occurred_at: "2026-04-22 09:45" },
  { id: "aud_3", actor: "officer@company.com", action: "Created leave transaction", entity: "leave_2", occurred_at: "2026-04-22 10:15" },
];

export default function AuditActivityPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Audit Activity</h1></section>
      <AuditHistoryPanel title="Recent Activity" events={events} />
    </div></main>
  );
}
