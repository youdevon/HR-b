import { createClient } from "@/lib/supabase/server";

export type FileMovementRecord = {
  id: string;
  employee_id: string | null;
  file_number: string | null;
  current_holder: string | null;
  current_location: string | null;
  moved_by: string | null;
  movement_type: string | null;
  from_department: string | null;
  to_department: string | null;
  from_location: string | null;
  to_location: string | null;
  from_custodian: string | null;
  to_custodian: string | null;
  date_sent: string | null;
  date_received: string | null;
  status: string | null;
  movement_status: string | null;
  movement_reason: string | null;
  expected_return_date: string | null;
  returned_at: string | null;
  remarks: string | null;
  created_at: string | null;
};

const FILE_MOVEMENT_SELECT = `
  id,
  employee_id,
  file_number,
  current_holder,
  current_location,
  moved_by,
  movement_type,
  from_department,
  to_department,
  from_location,
  to_location,
  from_custodian,
  to_custodian,
  date_sent,
  date_received,
  status,
  movement_status,
  movement_reason,
  expected_return_date,
  returned_at,
  remarks,
  created_at
`;

export async function listFileMovements(
  employeeId?: string
): Promise<FileMovementRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .order("date_sent", { ascending: false });

  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to load file movements: ${error.message}`);
  }

  return data ?? [];
}

export async function listFileMovementsByEmployeeId(
  employeeId: string
): Promise<FileMovementRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .eq("employee_id", employeeId)
    .order("date_sent", { ascending: false });

  if (error) {
    throw new Error(`Failed to load employee file movements: ${error.message}`);
  }

  return data ?? [];
}

export async function listInTransitFileMovements(): Promise<FileMovementRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .in("movement_status", ["transferred", "in_transit"])
    .order("date_sent", { ascending: false });

  if (error) {
    throw new Error(`Failed to load in-transit file movements: ${error.message}`);
  }

  return data ?? [];
}

export async function listMissingFileMovements(): Promise<FileMovementRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .eq("movement_status", "missing")
    .order("date_sent", { ascending: false });

  if (error) {
    throw new Error(`Failed to load missing file movements: ${error.message}`);
  }

  return data ?? [];
}

export async function getFileMovementById(
  id: string
): Promise<FileMovementRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load file movement: ${error.message}`);
  }

  return data ?? null;
}

export async function getCurrentFileMovementByEmployeeId(
  employeeId: string
): Promise<FileMovementRecord | null> {
  const movements = await listFileMovementsByEmployeeId(employeeId);

  return movements[0] ?? null;
}

export type FileMovementAction =
  | "check_out"
  | "transfer"
  | "return"
  | "archive"
  | "mark_missing";

export type CreateFileMovementInput = {
  employee_id: string;
  movement_type: FileMovementAction;
  current_holder?: string;
  current_location?: string;
  moved_by?: string;
  movement_reason?: string;
  expected_return_date?: string;
};

export async function createFileMovement(
  input: CreateFileMovementInput
): Promise<FileMovementRecord> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("file_movements")
    .insert({
      employee_id: input.employee_id,
      movement_type: input.movement_type,
      current_holder: input.current_holder || null,
      current_location: input.current_location || null,
      moved_by: input.moved_by || null,
      movement_reason: input.movement_reason || null,
      expected_return_date: input.expected_return_date || null,
      status: "active",
    })
    .select(FILE_MOVEMENT_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to create file movement: ${error.message}`);
  }

  return data;
}

export type ApplyFileMovementActionInput = {
  id: string;
  action: FileMovementAction;
  moved_by?: string;
  movement_reason?: string;
  current_holder?: string;
  current_location?: string;
  expected_return_date?: string;
};

export async function applyFileMovementAction(
  input: ApplyFileMovementActionInput
): Promise<FileMovementRecord> {
  const supabase = await createClient();

  const statusMap: Record<FileMovementAction, string> = {
    check_out: "checked_out",
    transfer: "in_transfer",
    return: "returned",
    archive: "archived",
    mark_missing: "missing",
  };

  const { data, error } = await supabase
    .from("file_movements")
    .update({
      movement_type: input.action,
      status: statusMap[input.action],
      moved_by: input.moved_by || null,
      movement_reason: input.movement_reason || null,
      current_holder: input.current_holder || null,
      current_location: input.current_location || null,
      expected_return_date: input.expected_return_date || null,
      returned_at: input.action === "return" ? new Date().toISOString() : null,
    })
    .eq("id", input.id)
    .select(FILE_MOVEMENT_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to apply file movement action: ${error.message}`);
  }

  return data;
}

export async function generateOverdueCheckedOutFileAlerts(): Promise<number> {
  const supabase = await createClient();

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("file_movements")
    .select("id")
    .eq("status", "checked_out")
    .lt("expected_return_date", today);

  if (error) {
    console.error("generateOverdueCheckedOutFileAlerts error:", error.message);
    return 0;
  }

  return (data ?? []).length;
}