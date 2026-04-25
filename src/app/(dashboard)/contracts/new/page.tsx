import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import ToastMessage from "@/components/ui/toast-message";
import EmployeeContractSelector from "@/components/domain/contracts/employee-contract-selector";
import ContractAllowancesEditor, {
  type ContractAllowanceDraft,
} from "@/components/domain/contracts/contract-allowances-editor";
import { assertPermission, getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { getEmployeeById, listEmployeeLookupOptions } from "@/lib/queries/employees";
import { createContractRecord, type ContractAllowanceInput } from "@/lib/queries/contracts";

type NewContractPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const CONTRACT_TYPE_OPTIONS = [
  { value: "temporary", label: "Short Term" },
  { value: "fixed_term", label: "Fixed Term" },
] as const;

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

const CONTRACT_TYPE_VALUES = new Set<string>(
  CONTRACT_TYPE_OPTIONS.map((option) => option.value)
);
const CONTRACT_STATUS_VALUES = new Set<string>(
  CONTRACT_STATUS_OPTIONS.map((option) => option.value)
);
const SALARY_FREQUENCY_VALUES = new Set<string>(
  SALARY_FREQUENCY_OPTIONS.map((option) => option.value)
);

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function input(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
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

function parseAllowancesJson(
  formData: FormData,
  canEditSalary: boolean
): ContractAllowanceInput[] {
  const raw = String(formData.get("allowances_json") ?? "[]");
  let parsed: unknown = [];
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Invalid allowances payload.");
  }
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((row) => row as Partial<ContractAllowanceDraft>)
    .map((row) => ({
      allowance_name: String(row.allowance_name ?? "").trim(),
      allowance_type: String(row.allowance_type ?? "").trim() || null,
      allowance_amount: canEditSalary ? Number(row.allowance_amount ?? 0) : 0,
      allowance_frequency: String(row.allowance_frequency ?? "monthly").trim().toLowerCase() as ContractAllowanceInput["allowance_frequency"],
      is_taxable: row.is_taxable === true,
      notes: String(row.notes ?? "").trim() || null,
    }))
    .filter((row) => row.allowance_name);
}

export default async function NewContractPage({ searchParams }: NewContractPageProps) {
  await requirePermission("contracts.create");
  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];
  const canViewSalary = hasAnyPermissionForContext(profile, permissions, ["contracts.salary.view"]);
  const canEditSalary = hasAnyPermissionForContext(profile, permissions, ["contracts.salary.edit"]);
  const canSetGratuity = hasAnyPermissionForContext(profile, permissions, ["contracts.gratuity.set"]);
  const canEditLeaveEntitlement = hasAnyPermissionForContext(profile, permissions, ["contracts.leave_entitlement.edit"]);
  const sp = await searchParams;
  const employeeId = firstString(sp.employeeId) ?? "";
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const created = firstString(sp.created) === "1";
  const employee = employeeId ? await getEmployeeById(employeeId) : null;
  const employeeName = employee
    ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || null
    : null;
  const employeeOptions = (await listEmployeeLookupOptions(300)).map((employeeOption) => ({
    ...employeeOption,
    full_name: `${employeeOption.first_name ?? ""} ${employeeOption.last_name ?? ""}`.trim(),
  }));

  async function createContractAction(formData: FormData) {
    "use server";
    await assertPermission("contracts.create");
    const actionAuth = await getDashboardSession();
    const actionProfile = actionAuth?.profile ?? null;
    const actionPermissions = actionAuth?.permissions ?? [];
    const allowSalaryEdit = hasAnyPermissionForContext(actionProfile, actionPermissions, ["contracts.salary.edit"]);
    const allowGratuitySet = hasAnyPermissionForContext(actionProfile, actionPermissions, ["contracts.gratuity.set"]);
    const allowLeaveEntitlementEdit = hasAnyPermissionForContext(actionProfile, actionPermissions, ["contracts.leave_entitlement.edit"]);
    const employee_id = input(formData, "employee_id");
    const contract_number = input(formData, "contract_number");
    const contract_type = input(formData, "contract_type").toLowerCase();
    const contract_status = input(formData, "contract_status").toLowerCase();
    const start_date = input(formData, "start_date");
    const end_date = input(formData, "end_date");
    const salary_frequency = (input(formData, "salary_frequency") || "monthly").toLowerCase();

    if (!employee_id) {
      redirect(
        `/contracts/new?status=error&message=${encodeURIComponent("Please select an employee before creating a contract.")}`
      );
    }
    if (!contract_number || !contract_type || !contract_status) {
      redirect(
        `/contracts/new?status=error&message=${encodeURIComponent("Contract number, type, and status are required.")}&employeeId=${encodeURIComponent(employee_id)}`
      );
    }
    if (!CONTRACT_TYPE_VALUES.has(contract_type)) {
      redirect(`/contracts/new?status=error&message=${encodeURIComponent("Invalid contract type.")}&employeeId=${encodeURIComponent(employee_id)}`);
    }
    if (!CONTRACT_STATUS_VALUES.has(contract_status)) {
      redirect(`/contracts/new?status=error&message=${encodeURIComponent("Invalid contract status.")}&employeeId=${encodeURIComponent(employee_id)}`);
    }
    if (!SALARY_FREQUENCY_VALUES.has(salary_frequency)) {
      redirect(`/contracts/new?status=error&message=${encodeURIComponent("Invalid salary frequency.")}&employeeId=${encodeURIComponent(employee_id)}`);
    }
    if (!start_date || !end_date) {
      redirect(`/contracts/new?status=error&message=${encodeURIComponent("Start date and end date are required.")}&employeeId=${encodeURIComponent(employee_id)}`);
    }
    if (end_date < start_date) {
      redirect(`/contracts/new?status=error&message=${encodeURIComponent("End date must be after or equal to start date.")}&employeeId=${encodeURIComponent(employee_id)}`);
    }

    let salaryAmount: number | null = null;
    let vacationLeaveDays = 0;
    let sickLeaveDays = 0;
    let allowances: ContractAllowanceInput[] = [];
    try {
      salaryAmount = allowSalaryEdit ? toNullableAmount(input(formData, "salary_amount")) : null;
      vacationLeaveDays = allowLeaveEntitlementEdit
        ? toNonNegativeDecimalOrZero(input(formData, "vacation_leave_days"), "Vacation leave days")
        : 0;
      sickLeaveDays = allowLeaveEntitlementEdit
        ? toNonNegativeDecimalOrZero(input(formData, "sick_leave_days"), "Sick leave days")
        : 0;
      allowances = parseAllowancesJson(formData, allowSalaryEdit);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Invalid contract values.";
      const qs = new URLSearchParams();
      qs.set("status", "error");
      qs.set("message", errorMessage);
      if (employee_id) qs.set("employeeId", employee_id);
      redirect(`/contracts/new?${qs.toString()}`);
    }

    try {
      await createContractRecord({
        employee_id,
        contract_number,
        contract_type,
        contract_status,
        start_date,
        end_date,
        salary_amount: salaryAmount,
        salary_frequency,
        is_gratuity_eligible: allowGratuitySet && formData.get("is_gratuity_eligible") === "on",
        vacation_leave_days: vacationLeaveDays,
        sick_leave_days: sickLeaveDays,
        allowances,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create contract.";
      const qs = new URLSearchParams();
      qs.set("status", "error");
      qs.set("message", errorMessage);
      if (employee_id) qs.set("employeeId", employee_id);
      redirect(`/contracts/new?${qs.toString()}`);
    }

    revalidatePath("/contracts");
    if (employee_id) {
      revalidatePath(`/employees/${employee_id}`);
      redirect(`/contracts/new?employeeId=${encodeURIComponent(employee_id)}&created=1`);
    }
    redirect("/contracts/new?created=1");
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="New Contract"
          description={
            employeeId
              ? `Create a contract linked to ${employeeName ?? "selected employee"} (File #: ${employee?.file_number ?? "—"}).`
              : "Create a contract linked to an employee profile."
          }
          backHref="/contracts"
        />

        {created ? (
          <ToastMessage message="Contract created successfully." />
        ) : null}

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
          <EmployeeContractSelector
            options={employeeOptions}
            initialSelectedEmployeeId={employeeId}
          />

          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Contract Basics</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Start and end dates drive leave availability, gratuity calculation, expiry alerts, and lifecycle status.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Contract Number</span>
                <input name="contract_number" required className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Contract Type</span>
                <select
                  name="contract_type"
                  required
                  defaultValue="fixed_term"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                >
                  {CONTRACT_TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
                <span className="text-sm font-medium text-neutral-700">End Date</span>
                <input name="end_date" type="date" required className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
              </label>
              {canViewSalary ? (
                <>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-neutral-700">Monthly Salary</span>
                    <input
                      name="salary_amount"
                      type="number"
                      min="0"
                      step="0.01"
                      disabled={!canEditSalary}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
                    />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-neutral-700">Salary Frequency</span>
                    <select
                      name="salary_frequency"
                      defaultValue="monthly"
                      disabled={!canEditSalary}
                      className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm disabled:bg-neutral-100"
                    >
                      {SALARY_FREQUENCY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
            </div>
            <label className="mt-4 flex items-start gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <input
                type="checkbox"
                name="is_gratuity_eligible"
                disabled={!canSetGratuity}
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

          {canEditLeaveEntitlement ? (
          <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
            <h2 className="text-lg font-semibold text-neutral-900">Leave Entitlements</h2>
            <p className="mt-1 text-sm text-neutral-600">
              These values are annual entitlements. The system creates yearly vacation and sick leave balances for each contract year with no rollover.
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Vacation Leave Days</span>
                <input
                  name="vacation_leave_days"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-sm font-medium text-neutral-700">Sick Leave Days</span>
                <input
                  name="sick_leave_days"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue="0"
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
          </section>
          ) : null}

          {canViewSalary ? (
            <ContractAllowancesEditor canEditAmounts={canEditSalary} />
          ) : (
            <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-neutral-900">Allowances</h2>
              <p className="mt-1 text-sm text-neutral-600">
                You do not have permission to view or edit allowance amounts.
              </p>
            </section>
          )}

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
