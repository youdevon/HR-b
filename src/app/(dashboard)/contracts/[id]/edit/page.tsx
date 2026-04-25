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
        contract_number: input(formData, "contract_number"),
        contract_title: input(formData, "contract_title"),
        contract_type: input(formData, "contract_type"),
        contract_status: input(formData, "contract_status"),
        start_date: input(formData, "start_date"),
        end_date: toNull(input(formData, "end_date")),
        effective_date: toNull(input(formData, "effective_date")),
        notice_period: toNull(input(formData, "notice_period")),
        job_title: toNull(input(formData, "job_title")),
        department: toNull(input(formData, "department")),
        signed_date: toNull(input(formData, "signed_date")),
        issued_date: toNull(input(formData, "issued_date")),
        salary_amount: toNullableAmount(input(formData, "salary_amount")),
        salary_frequency: toNull(input(formData, "salary_frequency")),
        is_gratuity_eligible: formData.get("is_gratuity_eligible") === "on",
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
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
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
            <input
              name="contract_type"
              defaultValue={contract.contract_type ?? ""}
              required
              placeholder="Contract type"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="contract_status"
              defaultValue={contract.contract_status ?? "active"}
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
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
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
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
                Check this only if gratuity applies to this contract. Short-term contracts can be left unchecked.
              </span>
            </span>
          </label>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Additional Details</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <input name="effective_date" type="date" defaultValue="" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="signed_date" type="date" defaultValue="" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="issued_date" type="date" defaultValue="" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="notice_period" defaultValue="" placeholder="Notice period" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="department" defaultValue={contract.department ?? ""} placeholder="Department" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="job_title" defaultValue={contract.job_title ?? ""} placeholder="Job title" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
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