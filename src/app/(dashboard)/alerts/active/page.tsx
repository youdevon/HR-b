import AlertList from "@/components/domain/alerts/alert-list";

const alerts = [{ id: "al_1", title: "Low Sick Leave Balance", severity: "High", status: "Active", employee_id: "emp_001", created_at: "2026-04-20" }];

export default function ActiveAlertsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Active Alerts</h1></section>
      <AlertList title="Active Alerts" alerts={alerts} />
    </div></main>
  );
}
