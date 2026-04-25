import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { getContractById, updateContractDetails } from "@/lib/queries/contracts";

type ContractEditPageProps = {
  params: Promise<{
    id: string;
  }>;
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

function toNullableAmount(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error("Salary amount must be greater than or equal to 0.");
  }
  return parsed;
}

function toNonNegativeDecimalOrZero(value: string, fieldLabel: string): number {
  if (!value) return 0;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${fieldLabel} must be greater than or equal to 0.`);
  }
  return parsed;
}

const CONTRACT_TYPE_OPTIONS = [
  { value: "temporary", label: "Short Term" },
  { value: "fixed_term", label: "Fixed Term" },
] as const;

function normalizeContractTypeForForm(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "short_term") return "temporary";
  if (normalized === "temporary" || normalized === "fixed_term") return normalized;
  return "fixed_term";
}

const CONTRACT_STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
  { value: "inactive", label: "Inactive" },
] as const;

const SALARY_FREQUENCY_OPTIONS = [
  { value: "monthly", label: "Monthly" },
  { value: "fortnightly", label: "Fortnightly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
] as const;

export default async function ContractEditPage({
  params,
  searchParams,
}: ContractEditPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const contract = await getContractById(id);
  if (!contract) notFound();

  async function updateContractAction(formData: FormData) {
    "use server";
    try {
      await updateContractDetails({
        id,
        employee_id: input(formData, "employee_id"),
        contract_number: input(formData, "contract_number"),
        contract_title: input(formData, "contract_title"),
        contract_type: input(formData, "contract_type"),
        contract_status: input(formData, "contract_status"),
        start_date: input(formData, "start_date"),
        end_date: input(formData, "end_date"),
        salary_amount: toNullableAmount(input(formData, "salary_amount")),
        salary_frequency: toNull(input(formData, "salary_frequency")),
        is_gratuity_eligible: formData.get("is_gratuity_eligible") === "on",
        vacation_leave_days: toNonNegativeDecimalOrZero(
          input(formData, "vacation_leave_days"),
          "Vacation leave days"
        ),
        sick_leave_days: toNonNegativeDecimalOrZero(
          input(formData, "sick_leave_days"),
          "Sick leave days"
        ),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update contract.";
      const qs = new URLSearchParams();
      qs.set("status", "error");
      qs.set("message", errorMessage);
      redirect(`/contracts/${id}/edit?${qs.toString()}`);
    }

    revalidatePath(`/contracts/${id}`);
    revalidatePath("/contracts");
    redirect(`/contracts/${id}?status=success&message=${encodeURIComponent("Contract updated successfully.")}`);
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="Edit Contract"
        description={`Update contract details for ${contract.employee_name ?? contract.employee_id ?? "employee"}.`}
        backHref={`/contracts/${id}`}
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

      <form action={updateContractAction} className="space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Contract Basics</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Start and end dates drive leave availability, gratuity calculation, expiry alerts, and lifecycle status.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input
              name="employee_id"
              defaultValue={contract.employee_id ?? ""}
              readOnly
              required
              placeholder="Employee ID"
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
            />
            <input
              name="contract_number"
              defaultValue={contract.contract_number ?? ""}
              required
              placeholder="Contract number"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="contract_title"
              defaultValue={contract.contract_title ?? ""}
              required
              placeholder="Contract title"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="contract_type"
              defaultValue={normalizeContractTypeForForm(contract.contract_type)}
              required
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {CONTRACT_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="contract_status"
              defaultValue={contract.effective_contract_status}
              required
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {CONTRACT_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              name="start_date"
              type="date"
              defaultValue={contract.start_date ?? ""}
              required
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="end_date"
              type="date"
              defaultValue={contract.end_date ?? ""}
              required
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="salary_amount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={contract.salary_amount ?? ""}
              placeholder="Monthly salary"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="salary_frequency"
              defaultValue={contract.salary_frequency ?? "monthly"}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              {SALARY_FREQUENCY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <label className="mt-4 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <input
              type="checkbox"
              name="is_gratuity_eligible"
              defaultChecked={contract.is_gratuity_eligible === true}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-300"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-900">Eligible for Gratuity</span>
              <span className="block text-xs text-neutral-600">
                Check this only if gratuity applies to this contract.
              </span>
            </span>
          </label>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Leave Entitlements</h2>
          <p className="mt-1 text-sm text-neutral-600">
            These leave entitlements will be used to create or update the employee&apos;s leave balances for this contract period.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              name="vacation_leave_days"
              type="number"
              min="0"
              step="0.01"
              defaultValue={contract.vacation_leave_days ?? 0}
              placeholder="Vacation leave days"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="sick_leave_days"
              type="number"
              min="0"
              step="0.01"
              defaultValue={contract.sick_leave_days ?? 0}
              placeholder="Sick leave days"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
        </section>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <button
            type="submit"
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Save Contract
          </button>
        </div>
      </form>
    </main>
  );
}