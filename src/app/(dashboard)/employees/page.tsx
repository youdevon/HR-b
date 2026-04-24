import Link from "next/link";
import { listEmployees } from "@/lib/queries/employees";

type EmployeesPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function EmployeesPage({
  searchParams,
}: EmployeesPageProps) {
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";

  const employees = await listEmployees({ query });

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Employees
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Manage employee records and physical file details.
          </p>
        </div>

        <Link
          href="/employees/new"
          className="inline-flex items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New Employee
        </Link>
      </div>

      <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <form className="flex flex-col gap-3 sm:flex-row" method="get">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Search by name, file number, employee number, department..."
            className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none placeholder:text-neutral-400 focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />

          <button
            type="submit"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Search
          </button>

          {query ? (
            <Link
              href="/employees"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Clear
            </Link>
          ) : null}
        </form>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">
            {query ? "No employees match your search." : "No employees found."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-200 text-left text-neutral-500">
                  <th className="px-3 py-3 font-medium">Employee #</th>
                  <th className="px-3 py-3 font-medium">File #</th>
                  <th className="px-3 py-3 font-medium">Name</th>
                  <th className="px-3 py-3 font-medium">Department</th>
                  <th className="px-3 py-3 font-medium">Job Title</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium">File Status</th>
                  <th className="px-3 py-3 font-medium">View</th>
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-neutral-100 transition hover:bg-neutral-50"
                  >
                    <td className="px-3 py-3">
                      {employee.employee_number ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {employee.file_number ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {employee.first_name ?? ""} {employee.last_name ?? ""}
                    </td>
                    <td className="px-3 py-3">
                      {employee.department ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {employee.job_title ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {employee.employment_status ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      {employee.file_status ?? "—"}
                    </td>
                    <td className="px-3 py-3">
                      <Link
                        href={`/employees/${employee.id}`}
                        className="text-sm font-medium text-neutral-900 underline underline-offset-4"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}