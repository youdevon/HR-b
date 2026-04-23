const mockInTransit = [
  { id: "mov_2", file_number: "FILE-1002", employee_id: "emp_002", to_department: "Operations", date_sent: "2026-04-18" },
  { id: "mov_7", file_number: "FILE-1018", employee_id: "emp_009", to_department: "Legal", date_sent: "2026-04-20" },
];

export default function InTransitFilesPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Files In Transit</h1>
          <p className="mt-1 text-sm text-neutral-600">Placeholder records currently in transit.</p>
        </section>
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">File #</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">To Department</th><th className="px-4 py-3">Date Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {mockInTransit.map((item) => (
                  <tr key={item.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{item.file_number}</td>
                    <td className="px-4 py-3">{item.employee_id}</td>
                    <td className="px-4 py-3">{item.to_department}</td>
                    <td className="px-4 py-3">{item.date_sent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
