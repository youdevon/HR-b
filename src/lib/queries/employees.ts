import { createClient } from "@/lib/supabase/server";
import { employeeSchema, type EmployeeInput } from "@/lib/validators/employee";

export type EmployeeListRecord = {
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

export type EmployeeRecord = {
  id: string;
  employee_number: string | null;
  file_number: string | null;
  first_name: string | null;
  middle_name: string | null;
  last_name: string | null;
  preferred_name: string | null;
  date_of_birth: string | null;
  department: string | null;
  division: string | null;
  job_title: string | null;
  employment_status: string | null;
  employment_type: string | null;
  hire_date: string | null;
  id_type: string | null;
  id_number: string | null;
  other_id_description: string | null;
  bir_number: string | null;
  work_email: string | null;
  personal_email: string | null;
  mobile_number: string | null;
  file_status: string | null;
  file_location: string | null;
  file_notes: string | null;
  created_at: string | null;
};

export type EmployeeSearchParams = {
  query?: string;
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

const EMPLOYEE_DETAIL_SELECT = `
  id,
  employee_number,
  file_number,
  first_name,
  middle_name,
  last_name,
  preferred_name,
  date_of_birth,
  department,
  division,
  job_title,
  employment_status,
  employment_type,
  hire_date,
  id_type,
  id_number,
  other_id_description,
  bir_number,
  work_email,
  personal_email,
  mobile_number,
  file_status,
  file_location,
  file_notes,
  created_at
`;

function normalizeEmployeeInput(input: EmployeeInput): EmployeeInput {
  return {
    ...input,
    file_status: input.file_status?.toLowerCase() ?? "active",
    id_type: input.id_type?.toLowerCase() ?? "national_id",
    employment_status: input.employment_status?.toLowerCase() ?? "active",
  };
}

export async function listEmployees(
  params?: EmployeeSearchParams
): Promise<EmployeeListRecord[]> {
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
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("listEmployees error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load employees: ${error.message}`);
  }

  return data ?? [];
}

export async function getEmployeeById(
  id: string
): Promise<EmployeeRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getEmployeeById error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load employee: ${error.message}`);
  }

  return data ?? null;
}

export async function createEmployee(
  input: EmployeeInput
): Promise<EmployeeListRecord> {
  const parsed = employeeSchema.parse(input);
  const normalized = normalizeEmployeeInput(parsed);

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .insert(normalized)
    .select(EMPLOYEE_LIST_SELECT)
    .single();

  if (error) {
    console.error("createEmployee error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to create employee: ${error.message}`);
  }

  return data;
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>
): Promise<EmployeeListRecord> {
  const parsed = employeeSchema.partial().parse(input);

  const normalized = {
    ...parsed,
    file_status: parsed.file_status?.toLowerCase(),
    id_type: parsed.id_type?.toLowerCase(),
    employment_status: parsed.employment_status?.toLowerCase(),
  };

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employees")
    .update(normalized)
    .eq("id", id)
    .select(EMPLOYEE_LIST_SELECT)
    .single();

  if (error) {
    console.error("updateEmployee error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to update employee: ${error.message}`);
  }

  return data;
}

export async function archiveEmployeeFile(
  id: string
): Promise<{ success: true; id: string }> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employees")
    .update({ file_status: "archived" })
    .eq("id", id);

  if (error) {
    console.error("archiveEmployeeFile error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to archive employee file: ${error.message}`);
  }

  return { success: true, id };
}