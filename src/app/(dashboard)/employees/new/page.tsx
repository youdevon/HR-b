import Link from "next/link";
import EmployeeForm from "@/components/domain/employees/employee-form";

export default function NewEmployeePage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
                New Employee
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Create a new employee master record.
              </p>
              <p className="mt-1 text-xs text-neutral-500">
                Submission writes directly to the live employee table.
              </p>
            </div>
            <Link
              href="/employees"
              className="inline-flex w-fit items-center rounded-xl bg-white px-4 py-2 text-sm font-medium text-neutral-900 ring-1 ring-neutral-300 transition hover:bg-neutral-50"
            >
              Back to Employees
            </Link>
          </div>
        </section>

        <EmployeeForm submitLabel="Create Employee" onSuccessRedirect="/employees" />
      </div>
    </main>
  );
}
