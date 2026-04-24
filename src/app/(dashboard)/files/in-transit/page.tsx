import Link from "next/link";
import { listInTransitFiles } from "@/lib/queries/files";

export default async function InTransitFilesPage() {
  const rows = await listInTransitFiles();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Files in transit</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Movements with status <span className="font-medium text-neutral-800">transferred</span> or{" "}
            <span className="font-medium text-neutral-800">in_transit</span>.
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">File #</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">To department</th>
                  <th className="px-4 py-3">Date sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {rows.map((item) => (
                  <tr key={item.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/files/${item.id}`} className="hover:underline">
                        {item.file_number ?? "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{item.employee_id ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{item.movement_status ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{item.to_department ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{item.date_sent ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!rows.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">No file movements in transit.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
