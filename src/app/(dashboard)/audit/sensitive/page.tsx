import AuditHistoryPanel from "@/components/domain/audit/audit-history-panel";
import PageHeader from "@/components/layout/page-header";

const events = [
  { id: "aud_2", actor: "officer@company.com", action: "Viewed employee document", entity: "doc_2", occurred_at: "2026-04-22 10:10" },
];

export default function AuditSensitivePage() {
  return (
    <main className="space-y-6">
      <PageHeader title="Sensitive Audit Actions" backHref="/audit/activity" />
      <AuditHistoryPanel title="Sensitive Events" events={events} />
    </main>
  );
}
