import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import RecordForm from "@/components/domain/records/record-form";
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
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown employee"
    : null;

  async function createRecordAction(formData: FormData) {
    "use server";
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
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                New HR Record
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Create a new entry in the Record Keeping module.
              </p>
              {employeeId ? (
                <p className="mt-2 inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                  Employee: {employeeName ?? employeeId}
                </p>
              ) : null}
            </div>
            <Link
              href={employeeId ? `/employees/${employeeId}` : "/records"}
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back
            </Link>
          </div>
        </section>

        <form action={createRecordAction} className="space-y-6">
          <RecordForm employeeId={employeeId} submitLabel="Create Record" />
        </form>
      </div>
    </main>
  );
}
