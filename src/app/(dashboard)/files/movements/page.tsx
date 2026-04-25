import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import {
  listFileMovements,
  listFileMovementsByEmployeeId,
} from "@/lib/queries/files";

type FileMovementsPageProps = {
  searchParams: Promise<{ q?: string; employeeId?: string }>;
};

export default async function FileMovementsPage({ searchParams }: FileMovementsPageProps) {
  const resolved = await searchParams;
  const query = resolved.q?.trim() ?? "";
  const employeeId = resolved.employeeId?.trim() ?? "";
  const movements = employeeId
    ? await listFileMovementsByEmployeeId(employeeId)
    : await listFileMovements({ query });

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="File Movements"
          description={
            employeeId
              ? `Search physical file transfer records. Filtered by employee: ${employeeId}`
              : "Search physical file transfer records."
          }
          backHref="/file-movements"
          actions={
            <>
            {!employeeId ? (
              <form className="w-full sm:w-80" method="get">
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search file number, status, department..."
                  className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
                />
              </form>
            ) : null}
            <Link
              href={employeeId ? `/file-movements/new?employeeId=${employeeId}` : "/file-movements/new"}
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              New Movement
            </Link>
            </>
          }
        />

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">File #</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {movements.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/files/${row.id}`} className="hover:underline">
                        {row.file_number ?? "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.employee_id ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.from_department ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.to_department ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.movement_status ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.date_sent ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!movements.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">
              {query ? "No movements match your search." : "No file movements found."}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
