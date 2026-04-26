import { createClient } from "@/lib/supabase/server";
import { employeeSchema, type EmployeeInput } from "@/lib/validators/employee";
import {
  DEFAULT_AUDIT_SOURCE_TYPE,
  writeAuditLog,
  type AuditJson,
} from "@/lib/queries/audit";
import type { DashboardAuthContext } from "@/lib/auth/guards";

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

export type EmployeeLookupRecord = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  file_number: string | null;
  department: string | null;
  job_title: string | null;
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

const EMPLOYEE_LOOKUP_SELECT = `
  id,
  first_name,
  last_name,
  file_number,
  department,
  job_title
`;

/**
 * Database guidance for uniqueness constraints (blank/null values excluded):
 *   create unique index if not exists idx_employees_id_number_unique
 *   on public.employees(id_number)
 *   where id_number is not null and id_number <> '';
 *
 *   create unique index if not exists idx_employees_bir_number_unique
 *   on public.employees(bir_number)
 *   where bir_number is not null and bir_number <> '';
 */

function normalizeEmployeeInput(input: EmployeeInput): EmployeeInput {
  return {
    ...input,
    file_status: input.file_status?.toLowerCase() ?? "active",
    id_type: input.id_type?.toLowerCase() ?? "national_id",
    employment_status: input.employment_status?.toLowerCase() ?? "active",
  };
}

function emptyStringsToNull<T extends Record<string, unknown>>(input: T) {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, value === "" ? null : value])
  );
}

function auditChangedFieldNames(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): string[] | null {
  const oldObj = oldValues ?? {};
  const newObj = newValues ?? {};
  const keys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
  const changed = [...keys].filter(
    (key) => JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])
  );
  return changed.length ? changed : null;
}

async function employeeNumberExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeNumber: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("employee_number", employeeNumber)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("employeeNumberExists error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to validate employee number uniqueness: ${error.message}`);
  }

  return Boolean(data?.id);
}

async function fileNumberExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  fileNumber: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("file_number", fileNumber)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("fileNumberExists error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to validate file number uniqueness: ${error.message}`);
  }

  return Boolean(data?.id);
}

async function idNumberExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  idNumber: string,
  excludeEmployeeId?: string
): Promise<boolean> {
  let query = supabase
    .from("employees")
    .select("id")
    .eq("id_number", idNumber)
    .limit(1);
  if (excludeEmployeeId) query = query.neq("id", excludeEmployeeId);
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("idNumberExists error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to validate ID number uniqueness: ${error.message}`);
  }
  return Boolean(data?.id);
}

async function birNumberExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  birNumber: string,
  excludeEmployeeId?: string
): Promise<boolean> {
  let query = supabase
    .from("employees")
    .select("id")
    .eq("bir_number", birNumber)
    .limit(1);
  if (excludeEmployeeId) query = query.neq("id", excludeEmployeeId);
  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error("birNumberExists error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to validate BIR number uniqueness: ${error.message}`);
  }
  return Boolean(data?.id);
}

function friendlyDuplicateError(error: unknown): string | null {
  if (!error || typeof error !== "object") return null;

  const constraint =
    "constraint" in error ? String(error.constraint ?? "").toLowerCase() : "";
  const details = "details" in error ? String(error.details ?? "").toLowerCase() : "";
  const message = "message" in error ? String(error.message ?? "").toLowerCase() : "";
  const haystack = `${constraint} ${details} ${message}`;

  if (haystack.includes("employee_number")) {
    return "Employee number already exists.";
  }
  if (haystack.includes("file_number")) {
    return "File number already exists.";
  }
  if (haystack.includes("id_number")) {
    return "Another employee already has this ID Number.";
  }
  if (haystack.includes("bir_number")) {
    return "Another employee already has this BIR Number.";
  }
  return null;
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

export async function listEmployeeLookupOptions(
  limit = 200
): Promise<EmployeeLookupRecord[]> {
  const supabase = await createClient();
  const safeLimit = Math.max(1, Math.min(500, Math.floor(limit)));
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_LOOKUP_SELECT)
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true })
    .limit(safeLimit);

  if (error) {
    console.error("listEmployeeLookupOptions error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load employee lookup options: ${error.message}`);
  }

  return (data ?? []) as EmployeeLookupRecord[];
}

export async function getEmployeeLookupById(
  id: string
): Promise<EmployeeLookupRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select(EMPLOYEE_LOOKUP_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getEmployeeLookupById error:", error.message);
    return null;
  }

  return (data as EmployeeLookupRecord | null) ?? null;
}

export async function createEmployee(
  input: EmployeeInput,
  actor?: DashboardAuthContext | null
): Promise<EmployeeListRecord> {
  const supabase = await createClient();
  const noEmployeeNumber = input.no_employee_number === true;
  const providedEmployeeNumber = input.employee_number?.trim() ?? "";
  const providedFileNumber = input.file_number?.trim() ?? "";
  const providedIdNumber = input.id_number?.trim() ?? "";
  const providedBirNumber = input.bir_number?.trim() ?? "";
  const resolvedEmployeeNumber = noEmployeeNumber
    ? ""
    : (providedEmployeeNumber || providedFileNumber);

  if (!providedFileNumber) {
    throw new Error("File number is required.");
  }

  if (resolvedEmployeeNumber) {
    const duplicateEmployeeNumber = await employeeNumberExists(
      supabase,
      resolvedEmployeeNumber
    );
    if (duplicateEmployeeNumber) {
      throw new Error("Employee number already exists.");
    }
  }

  const duplicateFileNumber = await fileNumberExists(supabase, providedFileNumber);
  if (duplicateFileNumber) {
    throw new Error("File number already exists.");
  }

  if (providedIdNumber) {
    const duplicateIdNumber = await idNumberExists(supabase, providedIdNumber);
    if (duplicateIdNumber) {
      throw new Error("Another employee already has this ID Number.");
    }
  }

  if (providedBirNumber) {
    const duplicateBirNumber = await birNumberExists(supabase, providedBirNumber);
    if (duplicateBirNumber) {
      throw new Error("Another employee already has this BIR Number.");
    }
  }

  const parsed = employeeSchema.parse({
    ...input,
    employee_number: resolvedEmployeeNumber,
    file_number: providedFileNumber,
    no_employee_number: noEmployeeNumber,
  });
  const normalized = normalizeEmployeeInput(parsed);
  const { no_employee_number: _noEmployeeNumber, ...insertable } = normalized;
  const payload = emptyStringsToNull(insertable);

  const response = await supabase
    .from("employees")
    .insert(payload)
    .select(EMPLOYEE_LIST_SELECT)
    .single();

  if (response.error) {
    const duplicateMessage = friendlyDuplicateError(response.error);
    if (duplicateMessage) {
      throw new Error(duplicateMessage);
    }
    console.error("createEmployee error:", JSON.stringify(response.error, null, 2));
    throw new Error(`Failed to create employee: ${response.error.message}`);
  }
  const data = response.data;

  const createdSnapshot: Record<string, unknown> = {
    employee_number: data.employee_number,
    file_number: data.file_number,
    first_name: data.first_name,
    last_name: data.last_name,
    department: data.department,
    job_title: data.job_title,
    employment_status: data.employment_status,
    file_status: data.file_status,
  };

  await writeAuditLog({
    module_name: "Employees",
    entity_type: "employee",
    entity_id: data.id,
    action_type: "employee_created",
    action_summary: `Created employee ${data.employee_number ?? data.id}.`,
    old_values: null,
    new_values: createdSnapshot as AuditJson,
    changed_fields: Object.keys(createdSnapshot),
    source_type: DEFAULT_AUDIT_SOURCE_TYPE,
    actor: actor
      ? {
          user_id: actor.user.id,
          display_name: `${actor.profile?.first_name ?? ""} ${actor.profile?.last_name ?? ""}`.trim() || actor.profile?.email || actor.user.email || null,
          role_code: actor.profile?.role_code ?? null,
          role_name: actor.profile?.role_name ?? null,
        }
      : null,
  });

  return data;
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>,
  actor?: DashboardAuthContext | null
): Promise<EmployeeListRecord> {
  const previous = await getEmployeeById(id);
  const parsed = employeeSchema.partial().parse(input);

  const normalizedInput = {
    ...parsed,
    file_status: parsed.file_status?.toLowerCase(),
    id_type: parsed.id_type?.toLowerCase(),
    employment_status: parsed.employment_status?.toLowerCase(),
  };
  if (parsed.no_employee_number === true) {
    normalizedInput.employee_number = "";
  } else if (
    parsed.no_employee_number === false &&
    (parsed.employee_number ?? "").trim() === "" &&
    (parsed.file_number ?? "").trim()
  ) {
    normalizedInput.employee_number = parsed.file_number?.trim();
  }
  const { no_employee_number: _noEmployeeNumber, ...updateable } = normalizedInput;
  const payload = emptyStringsToNull(updateable);

  const supabase = await createClient();
  const resolvedIdNumber = (normalizedInput.id_number ?? "").trim();
  const resolvedBirNumber = (normalizedInput.bir_number ?? "").trim();

  if (resolvedIdNumber) {
    const duplicateIdNumber = await idNumberExists(supabase, resolvedIdNumber, id);
    if (duplicateIdNumber) {
      throw new Error("Another employee already has this ID Number.");
    }
  }

  if (resolvedBirNumber) {
    const duplicateBirNumber = await birNumberExists(supabase, resolvedBirNumber, id);
    if (duplicateBirNumber) {
      throw new Error("Another employee already has this BIR Number.");
    }
  }

  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", id)
    .select(EMPLOYEE_LIST_SELECT)
    .single();

  if (error) {
    console.error("updateEmployee error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to update employee: ${error.message}`);
  }

  const oldSnapshot = previous
    ? {
        employee_number: previous.employee_number,
        file_number: previous.file_number,
        first_name: previous.first_name,
        last_name: previous.last_name,
        department: previous.department,
        job_title: previous.job_title,
        employment_status: previous.employment_status,
        file_status: previous.file_status,
        file_location: previous.file_location,
        file_notes: previous.file_notes,
      }
    : null;
  const newSnapshot = {
    employee_number: data.employee_number,
    file_number: data.file_number,
    first_name: data.first_name,
    last_name: data.last_name,
    department: data.department,
    job_title: data.job_title,
    employment_status: data.employment_status,
    file_status: data.file_status,
  };

  await writeAuditLog({
    module_name: "Employees",
    entity_type: "employee",
    entity_id: data.id,
    action_type: "employee_updated",
    action_summary: `Updated employee ${data.employee_number ?? data.id}.`,
    old_values: oldSnapshot as AuditJson,
    new_values: newSnapshot as AuditJson,
    changed_fields: auditChangedFieldNames(oldSnapshot, newSnapshot),
    source_type: DEFAULT_AUDIT_SOURCE_TYPE,
    actor: actor
      ? {
          user_id: actor.user.id,
          display_name: `${actor.profile?.first_name ?? ""} ${actor.profile?.last_name ?? ""}`.trim() || actor.profile?.email || actor.user.email || null,
          role_code: actor.profile?.role_code ?? null,
          role_name: actor.profile?.role_name ?? null,
        }
      : null,
  });

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