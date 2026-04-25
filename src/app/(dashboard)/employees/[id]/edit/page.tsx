import EmployeeForm from "@/components/domain/employees/employee-form";
import PageHeader from "@/components/layout/page-header";
import { getEmployeeById, updateEmployee } from "@/lib/queries/employees";
import type { EmployeeInput } from "@/lib/validators/employee";
import { notFound, redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const employee = await getEmployeeById(id);

  if (!employee) {
    notFound();
  }

  async function updateEmployeeAction(data: EmployeeInput) {
    "use server";

    await updateEmployee(id, data);
    redirect(`/employees/${id}`);
  }

  const initialValues: EmployeeInput = {
    employee_number: employee.employee_number ?? "",
    file_number: employee.file_number ?? "",
    first_name: employee.first_name ?? "",
    middle_name: employee.middle_name ?? "",
    last_name: employee.last_name ?? "",
    preferred_name: employee.preferred_name ?? "",
    date_of_birth: employee.date_of_birth ?? "",
    department: employee.department ?? "",
    division: employee.division ?? "",
    job_title: employee.job_title ?? "",
    employment_status: employee.employment_status ?? "active",
    employment_type: employee.employment_type ?? "contract",
    hire_date: employee.hire_date ?? "",
    id_type: employee.id_type ?? "national_id",
    id_number: employee.id_number ?? "",
    other_id_description: employee.other_id_description ?? "",
    bir_number: employee.bir_number ?? "",
    work_email: employee.work_email ?? "",
    personal_email: employee.personal_email ?? "",
    mobile_number: employee.mobile_number ?? "",
    file_status: employee.file_status ?? "active",
    file_location: employee.file_location ?? "",
    file_notes: employee.file_notes ?? "",
  };

  return (
    <main className="space-y-6">
      <PageHeader
        title="Edit employee"
        description={`Update profile and employment details for this employee record. ID: ${id}`}
        backHref={`/employees/${id}`}
      />

      <EmployeeForm
        initialValues={initialValues}
        submitLabel="Save Changes"
        onSubmitAction={updateEmployeeAction}
      />
    </main>
  );
}
