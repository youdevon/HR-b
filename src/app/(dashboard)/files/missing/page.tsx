const mockMissing = [
  { id: "mov_3", file_number: "FILE-1003", employee_id: "emp_003", last_seen: "Transfer checkpoint", date_sent: "2026-03-10" },
  { id: "mov_8", file_number: "FILE-1025", employee_id: "emp_010", last_seen: "Legal records desk", date_sent: "2026-02-15" },
];

export default function MissingFilesPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Missing Files</h1>
          <p className="mt-1 text-sm text-neutral-600">Placeholder records marked as missing.</p>
        </section>
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">File #</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">Last Seen</th><th className="px-4 py-3">Date Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {mockMissing.map((item) => (
                  <tr key={item.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">{item.file_number}</td>
                    <td className="px-4 py-3">{item.employee_id}</td>
                    <td className="px-4 py-3">{item.last_seen}</td>
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
