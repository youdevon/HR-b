import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import RecordForm from "@/components/domain/records/record-form";
import PageHeader from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { createRecord } from "@/lib/queries/records";
import { getEmployeeById } from "@/lib/queries/employees";

type NewRecordPageProps = {
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

export default async function NewRecordPage({ searchParams }: NewRecordPageProps) {
  await requirePermission("records.create");
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown employee"
    : null;

  async function createRecordAction(formData: FormData) {
    "use server";
    await requirePermission("records.create");
    const employee_id = input(formData, "employee_id");
    await createRecord({
      employee_id,
      record_title: input(formData, "record_title"),
      record_type: input(formData, "record_type"),
      record_category: input(formData, "record_category"),
      record_date: input(formData, "record_date"),
      reference_number: input(formData, "reference_number"),
      description: input(formData, "description"),
      status: input(formData, "status"),
      notes: input(formData, "notes"),
    });

    revalidatePath("/records");
    if (employee_id) {
      revalidatePath(`/employees/${employee_id}`);
      redirect(`/employees/${employee_id}`);
    }
    redirect("/records");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="New HR Record"
          description={
            employeeId
              ? `Create a new entry in the Record Keeping module for ${employeeName ?? employeeId}.`
              : "Create a new entry in the Record Keeping module."
          }
          backHref="/records"
        />

        <form action={createRecordAction} className="space-y-6">
          <RecordForm employeeId={employeeId} submitLabel="Create Record" />
        </form>
      </div>
    </main>
  );
}
