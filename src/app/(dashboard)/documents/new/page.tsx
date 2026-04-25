import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { getEmployeeById } from "@/lib/queries/employees";
import { createClient } from "@/lib/supabase/server";

type NewDocumentPageProps = {
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

export default async function NewDocumentPage({ searchParams }: NewDocumentPageProps) {
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown employee"
    : null;

  async function createDocumentAction(formData: FormData) {
    "use server";
    const employee_id = input(formData, "employee_id");

    const supabase = await createClient();
    const { error } = await supabase.from("documents").insert({
      employee_id: toNull(employee_id),
      document_category: input(formData, "document_category"),
      document_type: input(formData, "document_type"),
      document_title: input(formData, "document_title"),
      file_name: input(formData, "file_name"),
      document_status: input(formData, "document_status"),
      visibility_level: input(formData, "visibility_level"),
      document_description: toNull(input(formData, "document_description")),
      document_date: toNull(input(formData, "document_date")),
      issued_date: toNull(input(formData, "issued_date")),
      expiry_date: toNull(input(formData, "expiry_date")),
      notes: toNull(input(formData, "notes")),
    });

    if (error) {
      throw new Error(`Failed to create document: ${error.message}`);
    }

    revalidatePath("/documents");
    if (employee_id) {
      revalidatePath(`/employees/${employee_id}`);
      redirect(`/employees/${employee_id}`);
    }
    redirect("/documents");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="New Document"
          description={
            employeeId
              ? `Upload a document linked to ${employeeName ?? employeeId}.`
              : "Upload a document linked to employee profile. No employee preselected."
          }
          backHref="/documents"
        />
        <form action={createDocumentAction} className="space-y-6">
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
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Document Category</span>
                <select name="document_category" defaultValue="General" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm">
                  <option value="Employee">Employee</option>
                  <option value="Contract">Contract</option>
                  <option value="Leave">Leave</option>
                  <option value="Gratuity">Gratuity</option>
                  <option value="Physical File">Physical File</option>
                  <option value="General">General</option>
                </select>
              </label>
              <input name="document_type" required placeholder="Document Type" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="document_title" required placeholder="Document Title" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="file_name" required placeholder="file.pdf" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="document_status" required defaultValue="active" placeholder="Status" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="visibility_level" required defaultValue="internal" placeholder="Visibility" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="document_date" type="date" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="issued_date" type="date" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="expiry_date" type="date" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <textarea name="document_description" rows={3} placeholder="Description" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <textarea name="notes" rows={3} placeholder="Notes" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            </div>
          </section>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              Create Document
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
