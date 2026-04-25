import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEmployeeById } from "@/lib/queries/employees";
import { createLeaveApplication, LEAVE_TYPES } from "@/lib/queries/leave";

type NewLeavePageProps = {
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

function toNull(value: string): string | null {
  return value === "" ? null : value;
}

function toNumberOrNull(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export default async function NewLeavePage({ searchParams }: NewLeavePageProps) {
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown employee"
    : null;

  async function createLeaveAction(formData: FormData) {
    "use server";
    const employee_id = input(formData, "employee_id");

    await createLeaveApplication({
      employee_id: toNull(employee_id),
      leave_type: input(formData, "leave_type"),
      start_date: toNull(input(formData, "start_date")),
      end_date: toNull(input(formData, "end_date")),
      total_days: toNumberOrNull(input(formData, "total_days")),
      reason: toNull(input(formData, "reason")),
      notes: toNull(input(formData, "notes")),
      medical_certificate_required:
        String(formData.get("medical_certificate_required") ?? "") === "on",
      return_to_work_date: toNull(input(formData, "return_to_work_date")),
    });

    revalidatePath("/leave");
    revalidatePath("/leave/transactions");
    if (employee_id) {
      revalidatePath(`/employees/${employee_id}`);
      redirect(`/employees/${employee_id}`);
    }
    redirect("/leave");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">New Leave</h1>
              <p className="mt-1 text-sm text-neutral-600">Apply for leave linked to an employee profile.</p>
              {employeeId ? (
                <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                  Employee: {employeeName ?? employeeId}
                </p>
              ) : (
                <p className="mt-2 text-xs text-neutral-500">
                  No employee preselected. You can still create an unlinked leave record.
                </p>
              )}
            </div>
            <Link
              href={employeeId ? `/employees/${employeeId}` : "/leave"}
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back
            </Link>
          </div>
        </section>

        <form action={createLeaveAction} className="space-y-6">
          <input type="hidden" name="employee_id" value={employeeId} />
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Employee ID</span>
                <input value={employeeId} readOnly placeholder="Optional" className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Leave Type</span>
                <select name="leave_type" defaultValue="Vacation" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm">
                  {LEAVE_TYPES.map((leaveType) => (
                    <option key={leaveType} value={leaveType}>
                      {leaveType}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Total Days</span>
                <input name="total_days" type="number" step="0.5" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Start Date</span>
                <input name="start_date" type="date" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">End Date</span>
                <input name="end_date" type="date" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Return to Work Date</span>
                <input name="return_to_work_date" type="date" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <textarea name="reason" placeholder="Reason" rows={3} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <textarea name="notes" placeholder="Notes" rows={3} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <div className="mt-4 flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" name="medical_certificate_required" />
                Medical certificate required
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-neutral-700">
                <input type="checkbox" name="medical_certificate_received" />
                Medical certificate received
              </label>
            </div>
          </section>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              Create Leave Record
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
