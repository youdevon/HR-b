import AuditHistoryPanel from "@/components/domain/audit/audit-history-panel";

const events = [
  { id: "aud_2", actor: "officer@company.com", action: "Viewed employee document", entity: "doc_2", occurred_at: "2026-04-22 10:10" },
];

export default function AuditSensitivePage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Sensitive Audit Actions</h1></section>
      <AuditHistoryPanel title="Sensitive Events" events={events} />
    </div></main>
  );
}
