import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import EmptyStateCard from "@/components/ui/empty-state-card";
import { requirePermission } from "@/lib/auth/guards";
import { listEmployees } from "@/lib/queries/employees";
import {
  dashboardPanelClass,
  dashboardTableCellClass,
  dashboardTableHeadCellClass,
  dashboardTableHeadRowClass,
} from "@/lib/ui/dashboard-styles";

type AgeLimitStatus =
  | "Over Age Limit"
  | "Less Than 6 Months to 60"
  | "Less Than 1 Year to 60"
  | "Less Than 2 Years to 60"
  | "Less Than 3 Years to 60"
  | "Unknown";

function startOfDay(value: string | Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatLongDateNoComma(dateValue: string | Date | null | undefined): string {
  if (!dateValue) return "Not Available";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Not Available";
  return date
    .toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    .replace(",", "");
}

function calculateAge(
  dateOfBirth: string | Date | null | undefined,
  referenceDate = new Date()
): number | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  let age = referenceDate.getFullYear() - dob.getFullYear();
  const hasBirthdayPassedThisYear =
    referenceDate.getMonth() > dob.getMonth() ||
    (referenceDate.getMonth() === dob.getMonth() &&
      referenceDate.getDate() >= dob.getDate());
  if (!hasBirthdayPassedThisYear) age -= 1;
  return age;
}

function addYears(dateValue: string | Date, years: number): Date {
  const date = new Date(dateValue);
  date.setFullYear(date.getFullYear() + years);
  return date;
}

function getSixtiethBirthday(
  dateOfBirth: string | Date | null | undefined
): Date | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  return startOfDay(addYears(dob, 60));
}

function getAgeLimitStatus(dateOfBirth: string | Date | null | undefined): AgeLimitStatus {
  const sixtiethBirthday = getSixtiethBirthday(dateOfBirth);
  if (!sixtiethBirthday) return "Unknown";
  const today = startOfDay(new Date());
  if (today >= sixtiethBirthday) return "Over Age Limit";
  const diffMs = sixtiethBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 183) return "Less Than 6 Months to 60";
  if (diffDays <= 365) return "Less Than 1 Year to 60";
  if (diffDays <= 730) return "Less Than 2 Years to 60";
  if (diffDays <= 1095) return "Less Than 3 Years to 60";
  return "Unknown";
}

function getTimeRemainingUntil60(dateOfBirth: string | Date | null | undefined): string {
  const sixtiethBirthday = getSixtiethBirthday(dateOfBirth);
  if (!sixtiethBirthday) return "Unknown";
  const today = startOfDay(new Date());
  if (today >= sixtiethBirthday) return "Already 60 or over";
  const diffMs = sixtiethBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  const days = diffDays - years * 365 - months * 30;
  if (years > 0) return `${years} year(s), ${months} month(s)`;
  if (months > 0) return `${months} month(s), ${days} day(s)`;
  return `${days} day(s)`;
}

function statusBadgeClass(status: AgeLimitStatus): string {
  if (status === "Over Age Limit") return "bg-red-100 text-red-800";
  if (status === "Less Than 6 Months to 60") return "bg-red-100 text-red-800";
  if (status === "Less Than 1 Year to 60") return "bg-amber-100 text-amber-800";
  if (status === "Less Than 2 Years to 60") return "bg-yellow-100 text-yellow-800";
  if (status === "Less Than 3 Years to 60") return "bg-blue-100 text-blue-800";
  return "bg-neutral-100 text-neutral-700";
}

type Row = {
  id: string;
  name: string;
  fileNumber: string;
  department: string;
  jobTitle: string;
  dateOfBirth: string | null;
  currentAge: number | null;
  sixtiethBirthday: Date | null;
  timeRemaining: string;
  contractEndDate: string | null;
  ageLimitStatus: AgeLimitStatus;
};

export default async function AgeLimitMonitoringPage() {
  await requirePermission("employees.view");
  const employees = await listEmployees();
  const today = startOfDay(new Date());

  const rows: Row[] = employees
    .map((employee) => {
      const currentAge = calculateAge(employee.date_of_birth, today);
      const sixtiethBirthday = getSixtiethBirthday(employee.date_of_birth);
      const ageLimitStatus = getAgeLimitStatus(employee.date_of_birth);
      return {
        id: employee.id,
        name: `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown",
        fileNumber: employee.file_number ?? "—",
        department: employee.department ?? "—",
        jobTitle: employee.job_title ?? "—",
        dateOfBirth: employee.date_of_birth,
        currentAge,
        sixtiethBirthday,
        timeRemaining: getTimeRemainingUntil60(employee.date_of_birth),
        contractEndDate: employee.contract_end_date,
        ageLimitStatus,
      };
    })
    .filter((row) => row.currentAge !== null && row.currentAge >= 57);

  const overLimitRows = rows
    .filter((row) => row.currentAge !== null && row.currentAge >= 60)
    .sort(
      (a, b) =>
        (a.sixtiethBirthday?.getTime() ?? Number.POSITIVE_INFINITY) -
        (b.sixtiethBirthday?.getTime() ?? Number.POSITIVE_INFINITY)
    );

  const approachingRows = rows
    .filter((row) => row.currentAge !== null && row.currentAge >= 57 && row.currentAge < 60)
    .sort(
      (a, b) =>
        (a.sixtiethBirthday?.getTime() ?? Number.POSITIVE_INFINITY) -
        (b.sixtiethBirthday?.getTime() ?? Number.POSITIVE_INFINITY)
    );

  const orderedRows = [...overLimitRows, ...approachingRows];

  return (
    <main className="space-y-6">
      <PageHeader
        title="Age Limit Monitoring"
        description="Monitor employees approaching or over the age 60 contract threshold."
        backHref="/employees"
        actions={
          <Link
            href="/employees?show=all"
            className="inline-flex items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            View Employees
          </Link>
        }
      />

      {!orderedRows.length ? (
        <EmptyStateCard>No employees currently meet age-limit monitoring criteria.</EmptyStateCard>
      ) : (
        <section className={dashboardPanelClass}>
          <div className="mb-3 text-sm text-neutral-600">
            Showing {orderedRows.length} employee{orderedRows.length === 1 ? "" : "s"} aged 57 or above.
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className={dashboardTableHeadRowClass}>
                  <th className={dashboardTableHeadCellClass}>Employee Name</th>
                  <th className={dashboardTableHeadCellClass}>File #</th>
                  <th className={dashboardTableHeadCellClass}>Department</th>
                  <th className={dashboardTableHeadCellClass}>Job Title</th>
                  <th className={dashboardTableHeadCellClass}>Date of Birth</th>
                  <th className={dashboardTableHeadCellClass}>Current Age</th>
                  <th className={dashboardTableHeadCellClass}>60th Birthday</th>
                  <th className={dashboardTableHeadCellClass}>Time Remaining Until 60</th>
                  <th className={dashboardTableHeadCellClass}>Current Contract End Date</th>
                  <th className={dashboardTableHeadCellClass}>Age Limit Status</th>
                </tr>
              </thead>
              <tbody>
                {orderedRows.map((row) => (
                  <tr key={row.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                    <td className={dashboardTableCellClass}>
                      <Link href={`/employees/${row.id}`} className="font-medium text-neutral-900 hover:underline">
                        {row.name}
                      </Link>
                    </td>
                    <td className={dashboardTableCellClass}>{row.fileNumber}</td>
                    <td className={dashboardTableCellClass}>{row.department}</td>
                    <td className={dashboardTableCellClass}>{row.jobTitle}</td>
                    <td className={dashboardTableCellClass}>{formatLongDateNoComma(row.dateOfBirth)}</td>
                    <td className={dashboardTableCellClass}>
                      {row.currentAge === null ? "Not Available" : row.currentAge}
                    </td>
                    <td className={dashboardTableCellClass}>
                      {formatLongDateNoComma(row.sixtiethBirthday)}
                    </td>
                    <td className={dashboardTableCellClass}>{row.timeRemaining}</td>
                    <td className={dashboardTableCellClass}>
                      {formatLongDateNoComma(row.contractEndDate)}
                    </td>
                    <td className={dashboardTableCellClass}>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClass(
                          row.ageLimitStatus
                        )}`}
                      >
                        {row.ageLimitStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
