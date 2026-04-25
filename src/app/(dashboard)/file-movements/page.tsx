import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import {
  generateOverdueCheckedOutFileAlerts,
  listFileMovements,
} from "@/lib/queries/file-movements";

type FileMovementsPageProps = {
  searchParams: Promise<{
    employeeId?: string;
    q?: string;
  }>;
};

function statusTone(status: string | null): string {
  switch (status) {
    case "checked_out":
      return "bg-amber-100 text-amber-800";
    case "in_transit":
    case "transferred":
      return "bg-sky-100 text-sky-800";
    case "returned":
      return "bg-emerald-100 text-emerald-800";
    case "archived":
      return "bg-neutral-100 text-neutral-700";
    case "missing":
      return "bg-rose-100 text-rose-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default async function FileMovementsPage({
  searchParams,
}: FileMovementsPageProps) {
  await requirePermission("files.view");
  const auth = await getDashboardSession();
  const canMoveFiles = hasAnyPermissionForContext(
    auth?.profile ?? null,
    auth?.permissions ?? [],
    ["files.move", "employee.file.move"]
  );
  const sp = await searchParams;
  const employeeId = sp.employeeId?.trim() ?? "";
  const query = sp.q?.trim() ?? "";

  const [movements, overdueCount] = await Promise.all([
    listFileMovements({ employeeId: employeeId || undefined, query }),
    generateOverdueCheckedOutFileAlerts(),
  ]);

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="space-y-3">
          <PageHeader
            title="Physical File Movements"
            description={
              employeeId
                ? `End-to-end workflow for check out, transfer, return, archive, and missing-file actions. Filtered by employee: ${employeeId}`
                : "End-to-end workflow for check out, transfer, return, archive, and missing-file actions."
            }
            backHref="/dashboard"
            actions={
              <>
              {!employeeId ? (
                <form action="/file-movements" className="flex flex-col gap-2 sm:flex-row">
                  <input
                    name="q"
                    defaultValue={query}
                    placeholder="Search employee, file, location, status..."
                    className="min-w-72 rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button
                    type="submit"
                    className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                  >
                    Search
                  </button>
                  {query ? (
                    <Link
                      href="/file-movements"
                      className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-50"
                    >
                      Clear
                    </Link>
                  ) : null}
                </form>
              ) : null}
              {canMoveFiles ? (
                <Link
                  href={employeeId ? `/file-movements/new?employeeId=${employeeId}` : "/file-movements/new"}
                  className="inline-flex w-fit items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  New Movement
                </Link>
              ) : null}
              </>
            }
          />
          {overdueCount > 0 ? (
            <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {overdueCount} overdue checked-out file alert(s) generated.
            </p>
          ) : null}
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
                <tr>
                  <th className="px-4 py-3 text-left">Employee</th>
                  <th className="px-4 py-3 text-left">File #</th>
                  <th className="px-4 py-3 text-left">Holder</th>
                  <th className="px-4 py-3 text-left">Location</th>
                  <th className="px-4 py-3 text-left">Sent</th>
                  <th className="px-4 py-3 text-left">Received</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((movement) => (
                  <tr key={movement.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium text-neutral-900">
                        {movement.employee_name ?? movement.employee_id ?? "—"}
                      </div>
                      <div className="text-xs text-neutral-500">
                        {movement.employee_number ?? "No employee #"}
                      </div>
                    </td>
                    <td className="px-4 py-3">{movement.file_number ?? "—"}</td>
                    <td className="px-4 py-3">{movement.current_holder ?? "—"}</td>
                    <td className="px-4 py-3">{movement.current_location ?? "—"}</td>
                    <td className="px-4 py-3">{movement.date_sent ?? "—"}</td>
                    <td className="px-4 py-3">{movement.date_received ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(
                          movement.movement_status
                        )}`}
                      >
                        {movement.movement_status ?? "unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/file-movements/${movement.id}`}
                        className="text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!movements.length ? (
            <div className="px-6 py-10 text-center text-sm text-neutral-600">
              No file movement records found.
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}