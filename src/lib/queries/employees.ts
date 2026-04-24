import { createClient } from "@/lib/supabase/server";
import { employeeSchema, type EmployeeInput } from "@/lib/validators/employee";
import { writeAuditLog, type AuditJson } from "@/lib/queries/audit";

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

const EMPLOYEE_NUMBER_PREFIX = "EMP-";
const EMPLOYEE_NUMBER_MIN_DIGITS = 4;
const FILE_NUMBER_PREFIX = "FILE-";
const FILE_NUMBER_MIN_DIGITS = 4;

function parseEmployeeNumberSequence(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^EMP-(\d+)$/i);
  if (!match) return null;
  const sequence = Number(match[1]);
  if (!Number.isInteger(sequence) || sequence <= 0) return null;
  return sequence;
}

function formatEmployeeNumber(sequence: number): string {
  return `${EMPLOYEE_NUMBER_PREFIX}${String(sequence).padStart(EMPLOYEE_NUMBER_MIN_DIGITS, "0")}`;
}

function parseFileNumberSequence(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/^FILE-(\d+)$/i);
  if (!match) return null;
  const sequence = Number(match[1]);
  if (!Number.isInteger(sequence) || sequence <= 0) return null;
  return sequence;
}

function formatFileNumber(sequence: number): string {
  return `${FILE_NUMBER_PREFIX}${String(sequence).padStart(FILE_NUMBER_MIN_DIGITS, "0")}`;
}

async function getLatestEmployeeNumberSequence(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const { data, error } = await supabase
    .from("employees")
    .select("employee_number")
    .ilike("employee_number", `${EMPLOYEE_NUMBER_PREFIX}%`)
    .order("employee_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestEmployeeNumberSequence error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load latest employee number: ${error.message}`);
  }

  const parsed = parseEmployeeNumberSequence(data?.employee_number ?? null);
  return parsed ?? 0;
}

async function getLatestFileNumberSequence(
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<number> {
  const { data, error } = await supabase
    .from("employees")
    .select("file_number")
    .ilike("file_number", `${FILE_NUMBER_PREFIX}%`)
    .order("file_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("getLatestFileNumberSequence error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load latest file number: ${error.message}`);
  }

  const parsed = parseFileNumberSequence(data?.file_number ?? null);
  return parsed ?? 0;
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

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String(error.code ?? "") : "";
  return code === "23505";
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

export async function createEmployee(
  input: EmployeeInput
): Promise<EmployeeListRecord> {
  const supabase = await createClient();
  const providedEmployeeNumber = input.employee_number?.trim() ?? "";
  const providedFileNumber = input.file_number?.trim() ?? "";

  if (providedEmployeeNumber) {
    const duplicate = await employeeNumberExists(supabase, providedEmployeeNumber);
    if (duplicate) {
      throw new Error("Employee number already exists.");
    }
  }

  if (providedFileNumber) {
    const duplicate = await fileNumberExists(supabase, providedFileNumber);
    if (duplicate) {
      throw new Error("File number already exists.");
    }
  }

  const baseEmployeeSequence = providedEmployeeNumber
    ? parseEmployeeNumberSequence(providedEmployeeNumber) ?? 0
    : await getLatestEmployeeNumberSequence(supabase);
  const baseFileSequence = providedFileNumber
    ? parseFileNumberSequence(providedFileNumber) ?? 0
    : await getLatestFileNumberSequence(supabase);

  const parsed = employeeSchema.parse({
    ...input,
    employee_number: providedEmployeeNumber || formatEmployeeNumber(baseEmployeeSequence + 1),
    file_number: providedFileNumber || formatFileNumber(baseFileSequence + 1),
  });
  const normalized = normalizeEmployeeInput(parsed);

  const maxAttempts = 8;
  let data: EmployeeListRecord | null = null;
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const employeeNumber =
      providedEmployeeNumber || formatEmployeeNumber(baseEmployeeSequence + attempt);
    const fileNumber = providedFileNumber || formatFileNumber(baseFileSequence + attempt);

    const payload = emptyStringsToNull({
      ...normalized,
      employee_number: employeeNumber,
      file_number: fileNumber,
    });

    const response = await supabase
      .from("employees")
      .insert(payload)
      .select(EMPLOYEE_LIST_SELECT)
      .single();

    if (!response.error) {
      data = response.data;
      break;
    }

    lastError = response.error;
    const duplicateMessage = friendlyDuplicateError(response.error);
    if (duplicateMessage) {
      throw new Error(duplicateMessage);
    }

    if ((providedEmployeeNumber && providedFileNumber) || !isUniqueViolation(response.error)) {
      console.error("createEmployee error:", JSON.stringify(response.error, null, 2));
      throw new Error(`Failed to create employee: ${response.error.message}`);
    }
  }

  if (!data) {
    const message =
      lastError && typeof lastError === "object" && "message" in lastError
        ? String(lastError.message)
        : "Could not generate a unique employee number.";
    throw new Error(`Failed to create employee: ${message}`);
  }

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
    source_type: "application",
  });

  return data;
}

export async function updateEmployee(
  id: string,
  input: Partial<EmployeeInput>
): Promise<EmployeeListRecord> {
  const previous = await getEmployeeById(id);
  const parsed = employeeSchema.partial().parse(input);

  const normalized = {
    ...parsed,
    file_status: parsed.file_status?.toLowerCase(),
    id_type: parsed.id_type?.toLowerCase(),
    employment_status: parsed.employment_status?.toLowerCase(),
  };
  const payload = emptyStringsToNull(normalized);

  const supabase = await createClient();

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
    source_type: "application",
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