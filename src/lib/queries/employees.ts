import { createClient } from "@/lib/supabase/server";
import { employeeSchema, type EmployeeInput } from "@/lib/validators/employee";

export type EmployeeRecord = {
  id: string;
  employee_number: string | null;
  file_number: string | null;
  first_name: string | null;
  last_name: string | null;
  department: string | null;
  job_title: string | null;
  employment_status: string | null;
  file_status: string | null;
  created_at: string | null;
};

export type EmployeeSearchParams = {
  query?: string;
  department?: string;
  employment_status?: string;
  page?: number;
  pageSize?: number;
};

const EMPLOYEE_LIST_SELECT = `
  id,
  employee_number,
  file_number,
  first_name,
  last_name,
  department,
  job_title,
  employment_status,
  file_status,
  created_at
`;

export async function listEmployees(params?: EmployeeSearchParams): Promise<EmployeeRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();

  let query = supabase
    .from("employees")
    .select(EMPLOYEE_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (queryText) {
    query = query.or(
      [
        `employee_number.ilike.%${queryText}%`,
        `file_number.ilike.%${queryText}%`,
        `first_name.ilike.%${queryText}%`,
        `last_name.ilike.%${queryText}%`,
        `department.ilike.%${queryText}%`,
        `job_title.ilike.%${queryText}%`,
        `employment_status.ilike.%${queryText}%`,
        `file_status.ilike.%${queryText}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load employees: ${error.message}`);
  }

  return data ?? [];
}

export async function getEmployeeById(id: string): Promise<EmployeeRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_LIST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load employee: ${error.message}`);
  }

  return data ?? null;
}

export async function createEmployee(input: EmployeeInput): Promise<EmployeeRecord> {
  const parsed = employeeSchema.parse(input);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .insert(parsed)
    .select(EMPLOYEE_LIST_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to create employee: ${error.message}`);
  }

  return data;
}

export async function updateEmployee(id: string, input: Partial<EmployeeInput>): Promise<EmployeeRecord> {
  const supabase = await createClient();
  const parsed = employeeSchema.partial().parse(input);
  const { data, error } = await supabase
    .from("employees")
    .update(parsed)
    .eq("id", id)
    .select(EMPLOYEE_LIST_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update employee: ${error.message}`);
  }

  return data;
}

export async function archiveEmployeeFile(id: string): Promise<{ success: true; id: string }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("employees")
    .update({ file_status: "Archived" })
    .eq("id", id);

  if (error) {
    throw new Error(`Failed to archive employee file: ${error.message}`);
  }

  return { success: true, id };
}
