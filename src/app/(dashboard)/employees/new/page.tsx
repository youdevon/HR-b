import EmployeeForm from "@/components/domain/employees/employee-form";
import PageHeader from "@/components/layout/page-header";
import { createEmployee } from "@/lib/queries/employees";
import type { EmployeeInput } from "@/lib/validators/employee";
import { redirect } from "next/navigation";

export default function NewEmployeePage() {
  async function createEmployeeAction(data: EmployeeInput) {
    "use server";

    await createEmployee(data);
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