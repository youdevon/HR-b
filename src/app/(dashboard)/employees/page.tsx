import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import ClickableTableRow from "@/components/ui/clickable-table-row";
import ToastMessage from "@/components/ui/toast-message";
import { getDashboardSession, requirePermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";
import { listEmployees } from "@/lib/queries/employees";

type EmployeesPageProps = {
  searchParams: Promise<{
    q?: string;
    show?: string;
    created?: string;
  }>;
};

export default async function EmployeesPage({
  searchParams,
}: EmployeesPageProps) {
  await requirePermission("employees.view");
  const auth = await getDashboardSession();
  const canCreateEmployee = hasAnyPermissionForContext(
    auth?.profile ?? null,
    auth?.permissions ?? [],
    ["employees.create"]
  );
  const params = await searchParams;
  const query = params?.q?.trim() ?? "";
  const showAll = params?.show === "all";
  const created = params?.created === "1";
  const shouldShowEmployees = Boolean(query) || showAll;

  const employees = shouldShowEmployees ? await listEmployees({ query }) : [];

  return (
    <main className="space-y-6">
      <PageHeader
        title="Employees"
        description="Manage employee records and physical file details."
        backHref="/dashboard"
        actions={
          <>
          <Link
            href="/employees?show=all"
            className="inline-flex min-w-36 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Show all
          </Link>
          {canCreateEmployee ? (
            <Link
              href="/employees/new"
              className="inline-flex min-w-36 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              New Employee
            </Link>
          ) : null}
          </>
        }
      />

      {created ? (
        <ToastMessage message="Employee created successfully." />
      ) : null}

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

          {query || showAll ? (
            <Link
              href="/employees"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-center text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Clear
            </Link>
          ) : null}

        </form>
      </div>

      {!shouldShowEmployees ? null : employees.length === 0 ? (
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
                </tr>
              </thead>

              <tbody>
                {employees.map((employee) => (
                  <ClickableTableRow
                    key={employee.id}
                    href={`/employees/${employee.id}`}
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
                  </ClickableTableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}