import EmployeeForm from "@/components/domain/employees/employee-form";
import PageHeader from "@/components/layout/page-header";
import { assertPermission, requireDashboardAuth, requirePermission } from "@/lib/auth/guards";
import { createEmployee } from "@/lib/queries/employees";
import type { EmployeeInput } from "@/lib/validators/employee";
import { redirect } from "next/navigation";

export default async function NewEmployeePage() {
  await requirePermission("employees.create");
  async function createEmployeeAction(data: EmployeeInput) {
    "use server";
    await assertPermission("employees.create");
    const auth = await requireDashboardAuth();
    await createEmployee(data, auth);
    redirect("/employees?created=1");
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title="New Employee"
        description="Create a new employee record and assign their physical file number."
        backHref="/employees"
      />

      <EmployeeForm onSubmitAction={createEmployeeAction} />
    </main>
  );
}