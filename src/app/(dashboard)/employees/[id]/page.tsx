import Link from "next/link";
import { getEmployeeById } from "@/lib/queries/employees";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  const displayName = [employee.first_name, employee.last_name].filter(Boolean).join(" ").trim() || "Employee";

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">{displayName}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Employee profile and identifiers for HR records.
          </p>
          <p className="mt-2 font-mono text-xs text-neutral-500">{id}</p>
        </div>
        <Link
          href="/employees"
          className="inline-flex shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
        >
          All employees
        </Link>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-neutral-500">Employee number</dt>
            <dd className="mt-1 font-medium text-neutral-900">{employee.employee_number ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Department</dt>
            <dd className="mt-1 font-medium text-neutral-900">{employee.department ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Job title</dt>
            <dd className="mt-1 font-medium text-neutral-900">{employee.job_title ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Employment status</dt>
            <dd className="mt-1 font-medium text-neutral-900">{employee.employment_status ?? "—"}</dd>
          </div>
        </dl>
      </section>
    </main>
  );
}
