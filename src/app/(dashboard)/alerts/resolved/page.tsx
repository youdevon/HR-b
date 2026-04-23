import AlertList from "@/components/domain/alerts/alert-list";

const alerts = [{ id: "al_2", title: "Document Expiry Near", severity: "Medium", status: "Resolved", employee_id: "emp_003", created_at: "2026-04-12" }];

export default function ResolvedAlertsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Resolved Alerts</h1></section>
      <AlertList title="Resolved Alerts" alerts={alerts} />
    </div></main>
  );
}
