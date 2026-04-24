import EmployeeForm from "@/components/domain/employees/employee-form";
import { createEmployee } from "@/lib/queries/employees";
import type { EmployeeInput } from "@/lib/validators/employee";
import { redirect } from "next/navigation";

export default function NewEmployeePage() {
  async function createEmployeeAction(data: EmployeeInput) {
    "use server";

    await createEmployee(data);
    redirect("/employees");
  }

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          New Employee
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Create a new employee record and assign their physical file number.
        </p>
      </div>

      <EmployeeForm onSubmitAction={createEmployeeAction} />
    </main>
  );
}