import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEmployeeById } from "@/lib/queries/employees";
import {
  createFileMovement,
  type FileMovementAction,
} from "@/lib/queries/file-movements";

type NewFileMovementPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function input(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export default async function NewFileMovementPage({
  searchParams,
}: NewFileMovementPageProps) {
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() ||
      "Unknown employee"
    : null;

  async function createFileMovementAction(formData: FormData) {
    "use server";
    const employee_id = input(formData, "employee_id");
    if (!employee_id) redirect("/files/movements");

    const movement_type = input(formData, "movement_type") as FileMovementAction;
    await createFileMovement({
      employee_id,
      movement_type,
      current_holder: input(formData, "current_holder"),
      current_location: input(formData, "current_location"),
      moved_by: input(formData, "moved_by"),
      movement_reason: input(formData, "movement_reason"),
      expected_return_date: input(formData, "expected_return_date"),
    });

    revalidatePath("/files/movements");
    revalidatePath(`/employees/${employee_id}`);
    redirect(`/employees/${employee_id}`);
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                Move Physical File
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Create a physical file movement record linked to employee profile.
              </p>
              {employeeId ? (
                <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                  Employee: {employeeName ?? employeeId}
                </p>
              ) : (
                <p className="mt-2 text-xs text-neutral-500">
                  No employee preselected. Select this flow from Employee Profile quick actions.
                </p>
              )}
            </div>
            <Link
              href={employeeId ? `/employees/${employeeId}` : "/files/movements"}
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back
            </Link>
          </div>
        </section>

        <form action={createFileMovementAction} className="space-y-6">
          <input type="hidden" name="employee_id" value={employeeId} />
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Employee ID</span>
                <input
                  value={employeeId}
                  readOnly
                  placeholder="Optional"
                  className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400"
                />
              </label>
              <input
                name="current_holder"
                required
                placeholder="Current Holder"
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <select
                name="movement_type"
                defaultValue="check_out"
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="check_out">Check Out</option>
                <option value="transfer">Transfer</option>
                <option value="return">Return</option>
                <option value="archive">Archive</option>
                <option value="mark_missing">Mark Missing</option>
              </select>
              <input
                name="expected_return_date"
                type="date"
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                name="moved_by"
                placeholder="Moved By"
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                name="current_location"
                placeholder="Current Location"
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <textarea
                name="movement_reason"
                required
                rows={3}
                placeholder="Movement Reason"
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </section>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <button
              type="submit"
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Create Movement
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
