import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { getEmployeeById } from "@/lib/queries/employees";
import { createClient } from "@/lib/supabase/server";
import { validateContractDateOverlap } from "@/lib/queries/contracts";

type NewContractPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const CONTRACT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending" },
  { value: "draft", label: "Draft" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
] as const;

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

function toNullableAmount(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Salary amount must be greater than or equal to 0.");
  }
  return parsed;
}

export default async function NewContractPage({ searchParams }: NewContractPageProps) {
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown employee"
    : null;
  const suggestedContractTitle = employee?.job_title
    ? `${employee.job_title} Employment Contract`
    : "";

  async function createContractAction(formData: FormData) {
    "use server";
    const employee_id = input(formData, "employee_id");
    const start_date = input(formData, "start_date");
    const end_date = input(formData, "end_date");
    const effective_end = end_date || start_date;

    try {
      if (employee_id && start_date && effective_end) {
        await validateContractDateOverlap({
          employeeId: employee_id,
          newStartDate: start_date,
          newEndDate: effective_end,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to validate contract overlap.";
      const qs = new URLSearchParams();
      qs.set("status", "error");
      qs.set("message", errorMessage);
      if (employee_id) {
        qs.set("employeeId", employee_id);
      }
      redirect(`/contracts/new?${qs.toString()}`);
    }

    let salaryAmount: number | null = null;
    try {
      salaryAmount = toNullableAmount(input(formData, "salary_amount"));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid salary amount.";
      const qs = new URLSearchParams();
      qs.set("status", "error");
      qs.set("message", errorMessage);
      if (employee_id) qs.set("employeeId", employee_id);
      redirect(`/contracts/new?${qs.toString()}`);
    }

    const supabase = await createClient();
    const { error } = await supabase.from("contracts").insert({
      employee_id: toNull(employee_id),
      contract_number: input(formData, "contract_number"),
      contract_title: input(formData, "contract_title"),
      contract_type: input(formData, "contract_type"),
      contract_status: input(formData, "contract_status"),
      start_date,
      end_date: toNull(input(formData, "end_date")),
      effective_date: toNull(input(formData, "effective_date")),
      notice_period: toNull(input(formData, "notice_period")),
      job_title: toNull(input(formData, "job_title")),
      department: toNull(input(formData, "department")),
      signed_date: toNull(input(formData, "signed_date")),
      issued_date: toNull(input(formData, "issued_date")),
      salary_amount: salaryAmount,
      salary_frequency: toNull(input(formData, "salary_frequency")),
      is_gratuity_eligible: formData.get("is_gratuity_eligible") === "on",
    });

    if (error) {
      throw new Error(`Failed to create contract: ${error.message}`);
    }

    revalidatePath("/contracts");
    if (employee_id) {
      revalidatePath(`/employees/${employee_id}`);
      redirect(`/employees/${employee_id}`);
    }
    redirect("/contracts");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="New Contract"
          description={
            employeeId
              ? `Create a contract linked to ${employeeName ?? employeeId}.`
              : "Create a contract linked to an employee profile. No employee preselected."
          }
          backHref="/contracts"
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

        <form action={createContractAction} className="space-y-6">
          <input type="hidden" name="employee_id" value={employeeId} />
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Contract Basics</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Employee ID</span>
                <input value={employeeId} readOnly placeholder="Optional" className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 placeholder:text-neutral-400" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Contract Number</span>
                <input name="contract_number" required className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Contract Title</span>
                <input
                  name="contract_title"
                  required
                  defaultValue={suggestedContractTitle}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Contract Type</span>
                <input name="contract_type" required className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Contract Status</span>
                <select
                  name="contract_status"
                  required
                  defaultValue="active"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  {CONTRACT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Start Date</span>
                <input name="start_date" type="date" required className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Monthly Salary</span>
                <input
                  name="salary_amount"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Salary Frequency</span>
                <select
                  name="salary_frequency"
                  defaultValue="monthly"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </label>
            </div>
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <input
                type="checkbox"
                name="is_gratuity_eligible"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-300"
              />
              <span>
                <span className="block text-sm font-medium text-neutral-900">Eligible for Gratuity</span>
                <span className="block text-xs text-neutral-600">
                  Check this only if gratuity applies to this contract. Short-term contracts can be left unchecked.
                </span>
              </span>
            </label>
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Optional Details</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <input name="end_date" type="date" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="effective_date" type="date" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="signed_date" type="date" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input name="issued_date" type="date" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              <input
                name="department"
                placeholder="Department"
                defaultValue={employee?.department ?? ""}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                name="job_title"
                placeholder="Job Title"
                defaultValue={employee?.job_title ?? ""}
                className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
          </section>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
            <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
              Create Contract
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
