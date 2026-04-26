import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { FormActions, FormLabel } from "@/components/ui/form-primitives";
import EmployeeLeaveSelector from "@/components/domain/leave/employee-leave-selector";
import { assertPermission, requirePermission } from "@/lib/auth/guards";
import { getEmployeeById, listEmployeeLookupOptions } from "@/lib/queries/employees";
import {
  createLeaveApplication,
  formatLeaveType,
  LEAVE_TYPES,
} from "@/lib/queries/leave";
import {
  formCheckboxClass,
  formCheckboxRowClass,
  formInputClass,
  formPrimaryButtonClass,
  formSelectClass,
  formTextareaClass,
} from "@/lib/ui/form-styles";

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
  await requirePermission("leave.create");
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown employee"
    : null;

  const employeeOptions = (await listEmployeeLookupOptions(500)).map(
    (emp) => ({
      ...emp,
      full_name: `${emp.first_name ?? ""} ${emp.last_name ?? ""}`.trim(),
    })
  );

  async function createLeaveAction(formData: FormData) {
    "use server";
    await assertPermission("leave.create");
    const employee_id = input(formData, "employee_id");
    if (!employee_id) {
      const qs = new URLSearchParams();
      qs.set("status", "error");
      qs.set("message", "Please select an employee before creating leave.");
      redirect(`/leave/new?${qs.toString()}`);
    }
    try {
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
        medical_certificate_received:
          String(formData.get("medical_certificate_received") ?? "") === "on",
        return_to_work_date: toNull(input(formData, "return_to_work_date")),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to apply leave. Please review the form and try again.";
      const qs = new URLSearchParams();
      if (employee_id) {
        qs.set("employeeId", employee_id);
      }
      qs.set("status", "error");
      qs.set("message", errorMessage);
      redirect(`/leave/new?${qs.toString()}`);
    }

    revalidatePath("/leave");
    revalidatePath("/leave/transactions");
    if (employee_id) {
      revalidatePath(`/employees/${employee_id}`);
      redirect(`/employees/${employee_id}`);
    }
    redirect("/leave/transactions");
  }

  return (
    <main className="space-y-6">
        <PageHeader
          title="Apply Leave"
          description={
            employeeId
              ? `Apply for leave linked to ${employeeName ?? employeeId}.`
              : "Apply for leave linked to an employee profile."
          }
          backHref="/leave"
        />

        {message ? (
          <section
            className={`rounded-2xl border p-4 text-sm ${
              status === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-800"
            }`}
          >
            {message}
          </section>
        ) : null}

        <form action={createLeaveAction} className="space-y-6">
          <EmployeeLeaveSelector
            options={employeeOptions}
            initialSelectedEmployeeId={employeeId}
          />

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            <p className="font-medium">How leave types are processed:</p>
            <ul className="mt-1 list-disc pl-5 space-y-0.5">
              <li><strong>Sick leave</strong> is recorded after it is taken and will be deducted from your balance immediately.</li>
              <li><strong>Vacation leave</strong> requires approval before it is deducted from your balance.</li>
              <li>Other leave types default to pending approval.</li>
            </ul>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Leave Details</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Select leave type, dates, and provide reason or notes.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5">
                <FormLabel>Leave Type</FormLabel>
                <select name="leave_type" defaultValue="vacation_leave" className={formSelectClass}>
                  {LEAVE_TYPES.map((leaveType) => (
                    <option key={leaveType} value={leaveType}>
                      {formatLeaveType(leaveType)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <FormLabel>Total Days</FormLabel>
                <input name="total_days" type="number" step="0.5" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>Start Date</FormLabel>
                <input name="start_date" type="date" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>End Date</FormLabel>
                <input name="end_date" type="date" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>Return to Work Date</FormLabel>
                <input name="return_to_work_date" type="date" className={formInputClass} />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <FormLabel>Reason</FormLabel>
                <textarea name="reason" placeholder="Reason for leave" className={formTextareaClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>Notes</FormLabel>
                <textarea name="notes" placeholder="Optional notes" className={formTextareaClass} />
              </label>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <label className={formCheckboxRowClass}>
                <input type="checkbox" name="medical_certificate_required" className={formCheckboxClass} />
                <span className="text-sm font-medium text-neutral-700">Medical certificate required</span>
              </label>
              <label className={formCheckboxRowClass}>
                <input type="checkbox" name="medical_certificate_received" className={formCheckboxClass} />
                <span className="text-sm font-medium text-neutral-700">Medical certificate received</span>
              </label>
            </div>
          </section>
          <FormActions>
            <button type="submit" className={formPrimaryButtonClass}>
              Apply Leave
            </button>
          </FormActions>
        </form>
    
    </main>
  );
}
