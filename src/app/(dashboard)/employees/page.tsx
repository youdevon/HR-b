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
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Employees</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Manage employee records and files.
        </p>
      </div>

      {employees.length === 0 ? (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">No employees found.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
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
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-neutral-100">
                    <td className="px-3 py-3">{employee.employee_number}</td>
                    <td className="px-3 py-3">{employee.file_number}</td>
                    <td className="px-3 py-3">
                      {employee.first_name} {employee.last_name}
                    </td>
                    <td className="px-3 py-3">{employee.department}</td>
                    <td className="px-3 py-3">{employee.job_title}</td>
                    <td className="px-3 py-3">{employee.employment_status}</td>
                    <td className="px-3 py-3">{employee.file_status}</td>
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