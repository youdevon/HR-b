type Props = { params: { id: string } };

export default function AlertDetailPage({ params }: Props) {
  const alert = { title: "Low Sick Leave Balance", severity: "High", status: "Active", employee_id: "emp_001", description: "Sick leave is below configured threshold." };
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200"><h1 className="text-2xl font-semibold">Alert {params.id}</h1><p className="text-sm text-neutral-600">{alert.title}</p></section>
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 grid gap-3 text-sm">
        <p><strong>Employee:</strong> {alert.employee_id}</p>
        <p><strong>Severity:</strong> {alert.severity}</p>
        <p><strong>Status:</strong> {alert.status}</p>
        <p><strong>Description:</strong> {alert.description}</p>
      </section>
    </div></main>
  );
}
