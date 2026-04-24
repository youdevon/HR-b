import { createClient } from "@/lib/supabase/server";

export const RECORD_TYPES = [
  "Memo",
  "Letter",
  "Disciplinary",
  "Commendation",
  "Training",
  "Medical",
  "HR Note",
  "Other",
] as const;

export const RECORD_CATEGORIES = [
  "Employee File",
  "Contract",
  "Leave",
  "Payroll",
  "Compliance",
  "General",
] as const;

export type RecordType = (typeof RECORD_TYPES)[number];
export type RecordCategory = (typeof RECORD_CATEGORIES)[number];

export type RecordKeepingRecord = {
  id: string;
  employee_id: string | null;
  record_title: string | null;
  record_type: string | null;
  record_category: string | null;
  record_date: string | null;
  reference_number: string | null;
  description: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
};

export type RecordListParams = {
  query?: string;
};

const RECORD_SELECT = `
  id,
  employee_id,
  record_title,
  record_type,
  record_category,
  record_date,
  reference_number,
  description,
  status,
  notes,
  created_at
`;

function toNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function listRecords(
  params?: RecordListParams
): Promise<RecordKeepingRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();

  let query = supabase
    .from("records")
    .select(RECORD_SELECT)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (queryText) {
    query = query.or(
      [
        `record_title.ilike.%${queryText}%`,
        `record_type.ilike.%${queryText}%`,
        `record_category.ilike.%${queryText}%`,
        `reference_number.ilike.%${queryText}%`,
        `description.ilike.%${queryText}%`,
        `status.ilike.%${queryText}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load records: ${error.message}`);
  }

  return data ?? [];
}

export async function listRecordsByEmployeeId(
  employeeId: string
): Promise<RecordKeepingRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select(RECORD_SELECT)
    .eq("employee_id", employeeId)
    .order("record_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load employee records: ${error.message}`);
  }

  return data ?? [];
}

export async function getRecordById(
  id: string
): Promise<RecordKeepingRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("records")
    .select(RECORD_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load record: ${error.message}`);
  }

  return data ?? null;
}

export async function createRecord(input: {
  employee_id?: string;
  record_title: string;
  record_type: string;
  record_category: string;
  record_date?: string;
  reference_number?: string;
  description?: string;
  status: string;
  notes?: string;
}): Promise<RecordKeepingRecord> {
  const supabase = await createClient();
  const payload = {
    employee_id: toNull(input.employee_id),
    record_title: input.record_title.trim(),
    record_type: input.record_type.trim(),
    record_category: input.record_category.trim(),
    record_date: toNull(input.record_date),
    reference_number: toNull(input.reference_number),
    description: toNull(input.description),
    status: input.status.trim(),
    notes: toNull(input.notes),
  };

  const { data, error } = await supabase
    .from("records")
    .insert(payload)
    .select(RECORD_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to create record: ${error.message}`);
  }

  return data;
}
