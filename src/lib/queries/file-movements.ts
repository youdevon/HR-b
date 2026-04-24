import { createClient } from "@/lib/supabase/server";

export type FileMovementRecord = {
  id: string;
  employee_id: string | null;
  file_number: string | null;
  from_department: string | null;
  to_department: string | null;
  from_location: string | null;
  to_location: string | null;
  from_custodian: string | null;
  to_custodian: string | null;
  date_sent: string | null;
  date_received: string | null;
  movement_status: string | null;
  movement_reason: string | null;
  remarks: string | null;
  created_at: string | null;
};

const FILE_MOVEMENT_SELECT = `
  id,
  employee_id,
  file_number,
  from_department,
  to_department,
  from_location,
  to_location,
  from_custodian,
  to_custodian,
  date_sent,
  date_received,
  movement_status,
  movement_reason,
  remarks,
  created_at
`;

export async function listFileMovements(): Promise<FileMovementRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .order("date_sent", { ascending: false });

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