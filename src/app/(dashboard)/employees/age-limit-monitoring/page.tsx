import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import EmptyStateCard from "@/components/ui/empty-state-card";
import { requirePermission } from "@/lib/auth/guards";
import { listEmployees } from "@/lib/queries/employees";
import { createClient } from "@/lib/supabase/server";
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

type ContractPeriodRow = {
  employee_id: string | null;
  start_date: string | null;
  end_date: string | null;
};

type Row = {
  id: string;
  name: string;
  fileNumber: string;
  age: number | null;
  contractPeriod: string;
  ageLimitStatus: AgeLimitStatus;
  createdAt: string | null;
};

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
  if (!hasBirthdayPassedThisYear) {
    age -= 1;
  }
  return age;
}

function addYears(dateValue: string | Date, years: number): Date {
  const date = new Date(dateValue);
  date.setFullYear(date.getFullYear() + years);
  return date;
}

function getSixtiethBirthday(dateOfBirth: string | Date | null | undefined): Date | null {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;
  return startOfDay(addYears(dob, 60));
}

function getAgeLimitStatus(dateOfBirth: string | Date | null | undefined): AgeLimitStatus {
  const sixtiethBirthday = getSixtiethBirthday(dateOfBirth);
  if (!sixtiethBirthday) return "Unknown";
  const today = startOfDay(new Date());
  if (today >= sixtiethBirthday) {
    return "Over Age Limit";
  }
  const diffMs = sixtiethBirthday.getTime() - today.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays <= 183) return "Less Than 6 Months to 60";
  if (diffDays <= 365) return "Less Than 1 Year to 60";
  if (diffDays <= 730) return "Less Than 2 Years to 60";
  if (diffDays <= 1095) return "Less Than 3 Years to 60";
  return "Unknown";
}

function getCurrentOrLastContract(contracts: ContractPeriodRow[]): ContractPeriodRow | null {
  const today = startOfDay(new Date());
  const validContracts = contracts.filter((contract) => {
    const startDate = contract.start_date ? new Date(contract.start_date) : null;
    const endDate = contract.end_date ? new Date(contract.end_date) : null;
    return (
      Boolean(startDate) &&
      Boolean(endDate) &&
      !Number.isNaN(startDate!.getTime()) &&
      !Number.isNaN(endDate!.getTime())
    );
  });

  const currentContracts = validContracts.filter((contract) => {
    const startDate = startOfDay(contract.start_date as string);
    const endDate = startOfDay(contract.end_date as string);
    return startDate <= today && endDate >= today;
  });
  if (currentContracts.length > 0) {
    return (
      currentContracts.sort(
        (a, b) =>
          new Date(b.end_date as string).getTime() -
          new Date(a.end_date as string).getTime()
      )[0] ?? null
    );
  }

  const pastContracts = validContracts.filter((contract) => {
    const endDate = startOfDay(contract.end_date as string);
    return endDate < today;
  });
  if (pastContracts.length > 0) {
    return (
      pastContracts.sort(
        (a, b) =>
          new Date(b.end_date as string).getTime() -
          new Date(a.end_date as string).getTime()
      )[0] ?? null
    );
  }

  return (
    validContracts.sort(
      (a, b) =>
        new Date(b.end_date as string).getTime() -
        new Date(a.end_date as string).getTime()
    )[0] ?? null
  );
}

function contractPeriodText(contract: ContractPeriodRow | null): string {
  if (!contract?.start_date || !contract?.end_date) return "No Contract Found";
  return `${formatLongDateNoComma(contract.start_date)} to ${formatLongDateNoComma(
    contract.end_date
  )}`;
}

function statusBadgeClass(status: AgeLimitStatus): string {
  if (status === "Over Age Limit") return "bg-red-100 text-red-800";
  if (status === "Less Than 6 Months to 60") return "bg-red-100 text-red-800";
  if (status === "Less Than 1 Year to 60") return "bg-amber-100 text-amber-800";
  if (status === "Less Than 2 Years to 60") return "bg-yellow-100 text-yellow-800";
  if (status === "Less Than 3 Years to 60") return "bg-blue-100 text-blue-800";
  return "bg-neutral-100 text-neutral-700";
}

export default async function AgeLimitMonitoringPage() {
  await requirePermission("employees.view");
  const supabase = await createClient();
  const employees = await listEmployees();
  const employeeIds = employees.map((employee) => employee.id);
  const today = startOfDay(new Date());

  const { data: contractsData } = employeeIds.length
    ? await supabase
        .from("contracts")
        .select("employee_id, start_date, end_date")
        .in("employee_id", employeeIds)
    : { data: [] as ContractPeriodRow[] };

  const contractsByEmployeeId = (contractsData ?? []).reduce<Map<string, ContractPeriodRow[]>>(
    (map, row) => {
      const employeeId = (row.employee_id ?? "").trim();
      if (!employeeId) return map;
      const list = map.get(employeeId) ?? [];
      list.push(row as ContractPeriodRow);
      map.set(employeeId, list);
      return map;
    },
    new Map<string, ContractPeriodRow[]>()
  );

  const orderedRows = employees
    .map((employee) => {
      const age = calculateAge(employee.date_of_birth, today);
      const ageLimitStatus = getAgeLimitStatus(employee.date_of_birth);
      const contract = getCurrentOrLastContract(
        contractsByEmployeeId.get(employee.id) ?? []
      );
      return {
        id: employee.id,
        name: `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || "Unknown",
        fileNumber: employee.file_number ?? "—",
        age,
        contractPeriod: contractPeriodText(contract),
        ageLimitStatus,
        createdAt: employee.created_at ?? null,
      } satisfies Row;
    })
    .filter((row) => row.age !== null && row.age >= 57)
    .sort(
      (a, b) =>
        (b.createdAt ? new Date(b.createdAt).getTime() : Number.NEGATIVE_INFINITY) -
        (a.createdAt ? new Date(a.createdAt).getTime() : Number.NEGATIVE_INFINITY)
    );

  return (
    <main className="space-y-6">
      <PageHeader
        title="Age Limit Monitoring"
        description="Monitor employees approaching or over age 60 with current or last contract periods."
        backHref="/employees"
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
                  <th className={dashboardTableHeadCellClass}>First Name and Last Name</th>
                  <th className={dashboardTableHeadCellClass}>File #</th>
                  <th className={dashboardTableHeadCellClass}>Age</th>
                  <th className={dashboardTableHeadCellClass}>Contract Period</th>
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
                    <td className={dashboardTableCellClass}>
                      {row.age === null ? "Not Available" : `${row.age}`}
                    </td>
                    <td className={dashboardTableCellClass}>{row.contractPeriod}</td>
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
