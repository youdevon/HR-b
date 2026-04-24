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

  const displayName =
    [employee.first_name, employee.middle_name, employee.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || "Employee";

  const displayValue = (value: string | null): string => value?.trim() || "—";

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

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Personal Info</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">First name</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.first_name)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Middle name</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.middle_name)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Last name</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.last_name)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Preferred name</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.preferred_name)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Date of birth</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.date_of_birth)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Mobile number</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.mobile_number)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Work email</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.work_email)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Personal email</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.personal_email)}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Work Info</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">Employee number</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.employee_number)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Department</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.department)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Division</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.division)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Job title</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.job_title)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Employment status</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.employment_status)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Employment type</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.employment_type)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Hire date</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.hire_date)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Created at</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.created_at)}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Identification</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">ID type</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.id_type)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">ID number</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.id_number)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">Other ID description</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.other_id_description)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">BIR number</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.bir_number)}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">File Info</h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-neutral-500">File number</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.file_number)}</dd>
            </div>
            <div>
              <dt className="text-neutral-500">File status</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.file_status)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-neutral-500">File location</dt>
              <dd className="mt-1 font-medium text-neutral-900">{displayValue(employee.file_location)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-neutral-500">File notes</dt>
              <dd className="mt-1 whitespace-pre-wrap font-medium text-neutral-900">
                {displayValue(employee.file_notes)}
              </dd>
            </div>
          </dl>
        </article>
      </section>
    </main>
  );
}
