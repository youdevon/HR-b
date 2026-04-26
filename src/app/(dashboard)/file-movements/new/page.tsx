import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { FormActions, FormLabel } from "@/components/ui/form-primitives";
import { assertPermission, requireDashboardAuth, requirePermission } from "@/lib/auth/guards";
import { getEmployeeById } from "@/lib/queries/employees";
import { createFileMovement, type FileMovementAction } from "@/lib/queries/file-movements";
import {
  formHelperClass,
  formInputClass,
  formPrimaryButtonClass,
  formReadOnlyInputClass,
  formSelectClass,
  formTextareaClass,
} from "@/lib/ui/form-styles";

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

function toNull(value: string): string | null {
  return value === "" ? null : value;
}

export default async function NewFileMovementPage({
  searchParams,
}: NewFileMovementPageProps) {
  await requirePermission("files.move");
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName =
    employee
      ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() ||
        "Unknown employee"
      : null;

  async function createFileMovementAction(formData: FormData) {
    "use server";
    await assertPermission("files.move");
    const auth = await requireDashboardAuth();
    const employee_id = input(formData, "employee_id");
    const movement_type = input(formData, "movement_type") as FileMovementAction;
    await createFileMovement({
      employee_id: toNull(employee_id),
      file_number: toNull(input(formData, "file_number")),
      from_department: toNull(input(formData, "from_department")),
      to_department: toNull(input(formData, "to_department")),
      from_location: toNull(input(formData, "from_location")),
      to_location: toNull(input(formData, "to_location")),
      from_custodian: toNull(input(formData, "from_custodian")),
      to_custodian: toNull(input(formData, "to_custodian")),
      movement_type,
      movement_reason: toNull(input(formData, "movement_reason")),
      date_sent: toNull(input(formData, "date_sent")),
      date_received: toNull(input(formData, "date_received")),
      remarks: toNull(input(formData, "remarks")),
    }, auth);

    revalidatePath("/file-movements");
    if (employee_id) {
      revalidatePath(`/employees/${employee_id}`);
      redirect(`/employees/${employee_id}`);
    }
    redirect("/file-movements");
  }

  return (
    <main className="space-y-6">
        <PageHeader
          title="Move Physical File"
          description={
            employeeId
              ? `Create a physical file movement record linked to ${employeeName ?? employeeId}.`
              : "Create a physical file movement record linked to employee profile. No employee preselected."
          }
          backHref="/file-movements"
        />

        <form action={createFileMovementAction} className="space-y-6">
          <input type="hidden" name="employee_id" value={employeeId} />
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5">
                <FormLabel>Employee ID</FormLabel>
                <input value={employeeId} readOnly placeholder="Optional" className={formReadOnlyInputClass} />
                <p className={formHelperClass}>Prefilled from the link you used; not editable here.</p>
              </label>
              <label className="space-y-1.5">
                <FormLabel>File Number</FormLabel>
                <input name="file_number" defaultValue={employee?.file_number ?? ""} placeholder="File number" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>Movement Type</FormLabel>
                <select name="movement_type" defaultValue="check_out" className={formSelectClass}>
                  <option value="check_out">Check Out</option>
                  <option value="transfer">Transfer</option>
                  <option value="return">Return</option>
                  <option value="archive">Archive</option>
                  <option value="mark_missing">Mark Missing</option>
                </select>
              </label>
              <label className="space-y-1.5">
                <FormLabel>From Department</FormLabel>
                <input name="from_department" placeholder="From department" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>To Department</FormLabel>
                <input name="to_department" placeholder="To department" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>From Location</FormLabel>
                <input
                  name="from_location"
                  defaultValue={employee?.file_location ?? ""}
                  placeholder="From location"
                  className={formInputClass}
                />
              </label>
              <label className="space-y-1.5">
                <FormLabel>To Location</FormLabel>
                <input name="to_location" placeholder="To location" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>From Custodian</FormLabel>
                <input name="from_custodian" placeholder="From custodian" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>To Custodian / Holder</FormLabel>
                <input name="to_custodian" placeholder="To custodian or holder" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>Date Sent</FormLabel>
                <input name="date_sent" type="date" className={formInputClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>Date Received</FormLabel>
                <input name="date_received" type="date" className={formInputClass} />
              </label>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <FormLabel required>Movement Reason</FormLabel>
                <textarea name="movement_reason" required placeholder="Why is this file moving?" className={formTextareaClass} />
              </label>
              <label className="space-y-1.5">
                <FormLabel>Remarks</FormLabel>
                <textarea name="remarks" placeholder="Optional remarks" className={formTextareaClass} />
              </label>
            </div>
          </section>
          <FormActions>
            <button type="submit" className={formPrimaryButtonClass}>
              Create Movement
            </button>
          </FormActions>
        </form>
    
    </main>
  );
}
