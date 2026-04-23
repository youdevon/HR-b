export type AlertItem = {
  id: string;
  title: string;
  severity: string;
  status: string;
  employee_id: string;
  created_at: string;
};

type AlertListProps = {
  title: string;
  alerts: AlertItem[];
};

export default function AlertList({ title, alerts }: AlertListProps) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50">
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Severity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Employee</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 text-sm">
            {alerts.map((a) => (
              <tr key={a.id}>
                <td className="px-4 py-3">{a.title}</td>
                <td className="px-4 py-3">{a.severity}</td>
                <td className="px-4 py-3">{a.status}</td>
                <td className="px-4 py-3">{a.employee_id}</td>
                <td className="px-4 py-3">{a.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
