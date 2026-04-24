import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  applyFileMovementAction,
  generateOverdueCheckedOutFileAlerts,
  listFileMovements,
  type FileMovementAction,
} from "@/lib/queries/file-movements";

type FileMovementsPageProps = {
  searchParams: Promise<{
    employeeId?: string;
  }>;
};

function statusTone(status: string | null): string {
  switch (status) {
    case "checked_out":
      return "bg-amber-100 text-amber-800";
    case "in_transfer":
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
  const sp = await searchParams;
  const employeeId = sp.employeeId?.trim() ?? "";

  async function applyAction(formData: FormData) {
    "use server";
    const movementId = String(formData.get("movement_id") ?? "");
    const action = String(formData.get("action") ?? "") as FileMovementAction;
    const employee_id = String(formData.get("employee_id") ?? "");
    await applyFileMovementAction({
      id: movementId,
      action,
      moved_by: String(formData.get("moved_by") ?? ""),
      movement_reason: String(formData.get("movement_reason") ?? ""),
      current_holder: String(formData.get("current_holder") ?? ""),
      current_location: String(formData.get("current_location") ?? ""),
      expected_return_date: String(formData.get("expected_return_date") ?? ""),
    });

    revalidatePath("/file-movements");
    revalidatePath("/employees");
    if (employee_id) {
      revalidatePath(`/employees/${employee_id}`);
      redirect(`/employees/${employee_id}`);
    }
    redirect("/file-movements");
  }

  const [movements, overdueCount] = await Promise.all([
    listFileMovements(employeeId || undefined),
    generateOverdueCheckedOutFileAlerts(),
  ]);

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">
                Physical File Movements
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                End-to-end workflow for check out, transfer, return, archive, and missing-file actions.
              </p>
              {employeeId ? (
                <p className="mt-2 text-xs text-neutral-500">
                  Filtered by employee: {employeeId}
                </p>
              ) : null}
            </div>
            <Link
              href={employeeId ? `/file-movements/new?employeeId=${employeeId}` : "/file-movements/new"}
              className="inline-flex w-fit items-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              New Movement
            </Link>
          </div>
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
                  <th className="px-4 py-3 text-left">Current Holder</th>
                  <th className="px-4 py-3 text-left">Current Location</th>
                  <th className="px-4 py-3 text-left">Moved By</th>
                  <th className="px-4 py-3 text-left">Reason</th>
                  <th className="px-4 py-3 text-left">Type</th>
                  <th className="px-4 py-3 text-left">Expected Return</th>
                  <th className="px-4 py-3 text-left">Returned At</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {movements.map((movement) => (
                  <tr key={movement.id} className="align-top">
                    <td className="px-4 py-3">{movement.employee_id ?? "—"}</td>
                    <td className="px-4 py-3">{movement.current_holder ?? "—"}</td>
                    <td className="px-4 py-3">{movement.current_location ?? "—"}</td>
                    <td className="px-4 py-3">{movement.moved_by ?? "—"}</td>
                    <td className="px-4 py-3">{movement.movement_reason ?? "—"}</td>
                    <td className="px-4 py-3">{movement.movement_type ?? "—"}</td>
                    <td className="px-4 py-3">{movement.expected_return_date ?? "—"}</td>
                    <td className="px-4 py-3">{movement.returned_at ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusTone(
                          movement.status
                        )}`}
                      >
                        {movement.status ?? "unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="grid gap-2">
                        {(
                          [
                            ["check_out", "Check Out"],
                            ["transfer", "Transfer"],
                            ["return", "Return"],
                            ["archive", "Archive"],
                            ["mark_missing", "Mark Missing"],
                          ] as const
                        ).map(([actionValue, label]) => (
                          <form key={actionValue} action={applyAction} className="flex gap-2">
                            <input type="hidden" name="movement_id" value={movement.id} />
                            <input
                              type="hidden"
                              name="employee_id"
                              value={movement.employee_id ?? ""}
                            />
                            <input type="hidden" name="action" value={actionValue} />
                            <button
                              type="submit"
                              className="rounded-lg border border-neutral-300 px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                            >
                              {label}
                            </button>
                          </form>
                        ))}
                      </div>
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