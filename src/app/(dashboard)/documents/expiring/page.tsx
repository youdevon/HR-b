const mockExpiring = [
  { id: "doc_2", title: "Passport Copy", employee_id: "emp_003", category: "Employee", expiry_date: "2026-05-10" },
  { id: "doc_5", title: "Work Permit", employee_id: "emp_004", category: "Employee", expiry_date: "2026-05-22" },
];

export default function ExpiringDocumentsPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Expiring Documents</h1>
          <p className="mt-1 text-sm text-neutral-600">Placeholder documents nearing expiry.</p>
        </section>
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {mockExpiring.map((item) => (
                  <tr key={item.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{item.title}</td>
                    <td className="px-4 py-3">{item.employee_id}</td>
                    <td className="px-4 py-3">{item.category}</td>
                    <td className="px-4 py-3">{item.expiry_date}</td>
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
