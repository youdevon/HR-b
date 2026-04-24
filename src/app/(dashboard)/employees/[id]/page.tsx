import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeById } from "@/lib/queries/employees";
import { listLeaveBalancesByEmployeeId } from "@/lib/queries/leave";
import { listDocumentsByEmployeeId } from "@/lib/queries/documents";
import { listContractsByEmployeeId } from "@/lib/queries/contracts";
import { listFileMovementsByEmployeeId } from "@/lib/queries/files";
import { listAuditLogsByEmployeeId } from "@/lib/queries/audit";

type EmployeeDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function display(value: string | null | undefined) {
  return value && value.trim() ? value : "—";
}

function formatAuditWhen(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default async function EmployeeDetailPage({
  params,
}: EmployeeDetailPageProps) {
  const { id } = await params;
  const [employee, contracts, leaveBalances, documents, fileMovements, employeeAudits] =
    await Promise.all([
    getEmployeeById(id),
    listContractsByEmployeeId(id),
    listLeaveBalancesByEmployeeId(id),
    listDocumentsByEmployeeId(id),
    listFileMovementsByEmployeeId(id),
    listAuditLogsByEmployeeId(id),
  ]);

  if (!employee) {
    notFound();
  }

  const fullName = `${employee.first_name ?? ""} ${
    employee.last_name ?? ""
  }`.trim();

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            {fullName || "Employee Profile"}
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Employee #{display(employee.employee_number)} • File #
            {display(employee.file_number)}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href="/employees"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
          >
            Back
          </Link>

          <Link
            href={`/employees/${employee.id}/edit`}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Edit Employee
          </Link>
        </div>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Quick Actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/employees/${employee.id}/edit`}
            className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Edit Employee
          </Link>
          <Link
            href="/contracts/new"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Add Contract
          </Link>
          <Link
            href="/leave/new"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Add Leave Record
          </Link>
          <Link
            href="/documents/new"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Upload Document
          </Link>
          <Link
            href="/files/movements"
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
          >
            Move Physical File
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-neutral-900">Overview</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Employee identity, employment information, and physical file details.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryCard label="Employee Number" value={employee.employee_number} />
          <SummaryCard label="File Number" value={employee.file_number} />
          <SummaryCard label="Status" value={employee.employment_status} />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <InfoCard title="Personal Info">
          <InfoRow label="First Name" value={employee.first_name} />
          <InfoRow label="Last Name" value={employee.last_name} />
          <InfoRow label="Date of Birth" value={employee.date_of_birth} />
          <InfoRow label="Personal Email" value={employee.personal_email} />
          <InfoRow label="Mobile Number" value={employee.mobile_number} />
        </InfoCard>

        <InfoCard title="Work Info">
          <InfoRow label="Department" value={employee.department} />
          <InfoRow label="Division" value={employee.division} />
          <InfoRow label="Job Title" value={employee.job_title} />
          <InfoRow label="Employment Type" value={employee.employment_type} />
          <InfoRow label="Hire Date" value={employee.hire_date} />
          <InfoRow label="Work Email" value={employee.work_email} />
        </InfoCard>

        <InfoCard title="Identification">
          <InfoRow label="ID Type" value={employee.id_type} />
          <InfoRow label="ID Number" value={employee.id_number} />
          <InfoRow
            label="Other ID Description"
            value={employee.other_id_description}
          />
          <InfoRow label="BIR Number" value={employee.bir_number} />
        </InfoCard>

        <InfoCard title="Physical File Info">
          <InfoRow label="File Status" value={employee.file_status} />
          <InfoRow label="File Location" value={employee.file_location} />
          <InfoRow label="File Notes" value={employee.file_notes} />
        </InfoCard>
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Contracts</h2>
          <Link
            href="/contracts"
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>

        {contracts.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Number</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Start</th>
                  <th className="px-4 py-3">End</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {contracts.map((contract) => (
                  <tr key={contract.id} className="hover:bg-neutral-50">
                    <td className="max-w-[240px] truncate px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/contracts/${contract.id}`} className="hover:underline">
                        {display(contract.contract_title)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.contract_number)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.contract_type)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.contract_status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.start_date)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(contract.end_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No contracts found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Leave Balances
          </h2>
          <Link
            href="/leave/balances"
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>

        {leaveBalances.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Entitlement</th>
                  <th className="px-4 py-3">Used</th>
                  <th className="px-4 py-3">Remaining</th>
                  <th className="px-4 py-3">Effective</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {leaveBalances.map((balance) => (
                  <tr key={balance.id} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(balance.leave_type)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {balance.balance_year ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {balance.entitlement_days ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {balance.used_days ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      {balance.remaining_days ?? "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(balance.effective_from)} - {display(balance.effective_to)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No leave balances found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">Documents</h2>
          <Link
            href="/documents"
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>

        {documents.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {documents.map((document) => (
                  <tr key={document.id} className="hover:bg-neutral-50">
                    <td className="max-w-[260px] truncate px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/documents/${document.id}`} className="hover:underline">
                        {display(document.document_title)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(document.document_category)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(document.document_type)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(document.document_status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(document.expiry_date)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No documents found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Physical File Movements
          </h2>
          <Link
            href="/files/movements"
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            View all
          </Link>
        </div>

        {fileMovements.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200 text-sm">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">File Number</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date Sent</th>
                  <th className="px-4 py-3">Date Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-neutral-700">
                {fileMovements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/files/${movement.id}`} className="hover:underline">
                        {display(movement.file_number)}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.from_department)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.to_department)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.movement_status)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.date_sent)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      {display(movement.date_received)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            No physical file movements found for this employee.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">Audit History</h2>
            <p className="text-sm text-neutral-600">
              Timeline of updates made to this employee file.
            </p>
          </div>
          <Link
            href={`/audit/activity?employee_id=${employee.id}`}
            className="text-sm font-medium text-neutral-700 hover:text-neutral-900"
          >
            Open filtered activity
          </Link>
        </div>

        {employeeAudits.length ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {employeeAudits.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-col rounded-2xl border border-neutral-200/90 bg-neutral-50/40 p-4 shadow-sm ring-1 ring-neutral-100/80 transition hover:border-neutral-300 hover:bg-white"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="inline-flex rounded-lg bg-white px-2 py-1 text-xs font-semibold text-neutral-800 ring-1 ring-neutral-200">
                    {entry.action_type}
                  </span>
                  <time className="shrink-0 text-xs font-medium text-neutral-500">
                    {formatAuditWhen(entry.event_timestamp ?? entry.created_at)}
                  </time>
                </div>
                <p className="mt-3 text-sm font-medium leading-snug text-neutral-900">
                  {entry.action_summary}
                </p>
                <p className="mt-2 text-xs text-neutral-600">
                  <span className="font-medium text-neutral-700">By:</span>{" "}
                  {entry.performed_by_name ?? "System"}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {(entry.changed_fields ?? []).length > 0 ? (
                    (entry.changed_fields ?? []).map((field) => (
                      <span
                        key={field}
                        className="inline-flex rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-900 ring-1 ring-violet-200/70"
                      >
                        {field}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-neutral-400">No changed fields listed</span>
                  )}
                </div>
                <div className="mt-4 border-t border-neutral-200/80 pt-3">
                  <Link
                    href={`/audit/${entry.id}?return_to=${encodeURIComponent(`/employees/${employee.id}`)}`}
                    className="text-sm font-semibold text-neutral-900 underline-offset-2 hover:underline"
                  >
                    View audit detail
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">No audit entries for this employee yet.</p>
        )}
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-neutral-900">
        {display(value)}
      </p>
    </div>
  );
}

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
      <dl className="mt-4 divide-y divide-neutral-100">{children}</dl>
    </section>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-neutral-500">{label}</dt>
      <dd className="text-sm text-neutral-900 sm:col-span-2">
        {display(value)}
      </dd>
    </div>
  );
}