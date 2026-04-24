import { createClient } from "@/lib/supabase/server";
import type { FileMovement } from "@/lib/validators/file-movement";

export const FILE_MOVEMENT_SELECT = `
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
  created_at,
  updated_at
`;

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
  movement_status: FileMovement["movement_status"] | string | null;
  movement_reason: string | null;
  remarks: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type FileMovementSearchParams = {
  query?: string;
};

export async function listFileMovements(params?: FileMovementSearchParams): Promise<FileMovementRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();

  let query = supabase.from("file_movements").select(FILE_MOVEMENT_SELECT).order("created_at", { ascending: false });

  if (queryText) {
    query = query.or(
      [
        `file_number.ilike.%${queryText}%`,
        `employee_id.ilike.%${queryText}%`,
        `from_department.ilike.%${queryText}%`,
        `to_department.ilike.%${queryText}%`,
        `movement_status.ilike.%${queryText}%`,
        `movement_reason.ilike.%${queryText}%`,
      ].join(","),
    );
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to load file movements: ${error.message}`);
  }

  return (data ?? []) as FileMovementRecord[];
}

export async function getFileMovementById(id: string): Promise<FileMovementRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load file movement: ${error.message}`);
  }

  return (data as FileMovementRecord | null) ?? null;
}

/** Movements currently in progress: `transferred` or `in_transit`. */
export async function listInTransitFiles(): Promise<FileMovementRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .in("movement_status", ["transferred", "in_transit"])
    .order("date_sent", { ascending: false });

  if (error) {
    throw new Error(`Failed to load in-transit file movements: ${error.message}`);
  }

  return (data ?? []) as FileMovementRecord[];
}

export async function listMissingFiles(): Promise<FileMovementRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("file_movements")
    .select(FILE_MOVEMENT_SELECT)
    .eq("movement_status", "missing")
    .order("date_sent", { ascending: false });

  if (error) {
    throw new Error(`Failed to load missing file movements: ${error.message}`);
  }

  return (data ?? []) as FileMovementRecord[];
}
