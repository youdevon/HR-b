const mockExpired = [
  { id: "doc_3", title: "Medical Certificate", employee_id: "emp_002", category: "Leave", expired_on: "2026-03-01" },
  { id: "doc_6", title: "Old ID Copy", employee_id: "emp_009", category: "Employee", expired_on: "2026-01-15" },
];

export default function ExpiredDocumentsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Expired Documents</h1>
          <p className="mt-1 text-sm text-neutral-600">Placeholder documents already expired.</p>
        </section>
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Expired On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {mockExpired.map((item) => (
                  <tr key={item.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{item.title}</td>
                    <td className="px-4 py-3">{item.employee_id}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">{item.expired_on}</td>
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
