import { createClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/queries/audit";
import type { DashboardAuthContext } from "@/lib/auth/guards";

export type FileMovementRecord = {
  id: string;
  employee_id: string | null;
  employee_name: string | null;
  employee_number: string | null;
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
  current_holder: string | null;
  current_location: string | null;
};

type FileMovementRow = Omit<
  FileMovementRecord,
  "employee_name" | "employee_number" | "current_holder" | "current_location"
>;

type EmployeeFileRow = {
  id: string;
  employee_number: string | null;
  file_number: string | null;
  first_name: string | null;
  last_name: string | null;
};

export const FILE_MOVEMENT_ACTIONS = [
  "check_out",
  "transfer",
  "return",
  "archive",
  "mark_missing",
] as const;

export const FILE_MOVEMENT_STATUSES = [
  "active",
  "checked_out",
  "transferred",
  "returned",
  "archived",
  "missing",
  "in_transit",
] as const;

export type FileMovementAction = (typeof FILE_MOVEMENT_ACTIONS)[number];
export type FileMovementStatus = (typeof FILE_MOVEMENT_STATUSES)[number];

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

function toNull(value?: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function employeeName(row: EmployeeFileRow | undefined): string | null {
  const name = [row?.first_name, row?.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

function includesText(value: string | null | undefined, query: string): boolean {
  return Boolean(value?.toLowerCase().includes(query));
}

function statusForAction(action: FileMovementAction): FileMovementStatus {
  const statusMap: Record<FileMovementAction, FileMovementStatus> = {
    check_out: "checked_out",
    transfer: "in_transit",
    return: "returned",
    archive: "archived",
    mark_missing: "missing",
  };
  return statusMap[action];
}

function deriveCurrentHolder(row: {
  movement_status?: string | null;
  from_custodian?: string | null;
  to_custodian?: string | null;
}): string | null {
  if (row.movement_status === "returned") return toNull(row.from_custodian);
  return toNull(row.to_custodian) ?? toNull(row.from_custodian);
}

function deriveCurrentLocation(row: {
  movement_status?: string | null;
  from_location?: string | null;
  to_location?: string | null;
}): string | null {
  if (row.movement_status === "returned") return toNull(row.from_location);
  return toNull(row.to_location) ?? toNull(row.from_location);
}

async function enrichFileMovements(rows: FileMovementRow[]): Promise<FileMovementRecord[]> {
  const employeeIds = [
    ...new Set(rows.map((row) => row.employee_id).filter((id): id is string => Boolean(id))),
  ];
  const employeeById = new Map<string, EmployeeFileRow>();

  if (employeeIds.length) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("employees")
      .select("id, employee_number, file_number, first_name, last_name")
      .in("id", employeeIds);

    if (error) {
      throw new Error(`Failed to load file movement employee context: ${error.message}`);
    }

    for (const employee of data ?? []) {
      employeeById.set(employee.id, employee as EmployeeFileRow);
    }
  }

  return rows.map((row) => {
    const employee = row.employee_id ? employeeById.get(row.employee_id) : undefined;
    return {
      ...row,
      employee_name: employeeName(employee),
      employee_number: employee?.employee_number ?? null,
      file_number: row.file_number ?? employee?.file_number ?? null,
      current_holder: deriveCurrentHolder(row),
      current_location: deriveCurrentLocation(row),
    };
  });
}

export type FileMovementListParams = {
  employeeId?: string;
  query?: string;
};

export async function listFileMovements(
  params?: string | FileMovementListParams
): Promise<FileMovementRecord[]> {
  const supabase = await createClient();
  const employeeId = typeof params === "string" ? params : params?.employeeId;
  const queryText = typeof params === "string" ? "" : params?.query?.trim().toLowerCase() ?? "";

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

  const enriched = await enrichFileMovements((data ?? []) as FileMovementRow[]);

  if (!queryText) return enriched;

  return enriched.filter((movement) => {
    return (
      includesText(movement.employee_name, queryText) ||
      includesText(movement.employee_number, queryText) ||
      includesText(movement.employee_id, queryText) ||
      includesText(movement.file_number, queryText) ||
      includesText(movement.current_location, queryText) ||
      includesText(movement.to_location, queryText) ||
      includesText(movement.from_location, queryText) ||
      includesText(movement.movement_status, queryText)
    );
  });
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

  return enrichFileMovements((data ?? []) as FileMovementRow[]);
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

  return enrichFileMovements((data ?? []) as FileMovementRow[]);
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

  return enrichFileMovements((data ?? []) as FileMovementRow[]);
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

  if (!data) return null;
  const [movement] = await enrichFileMovements([data as FileMovementRow]);
  return movement ?? null;
}

export async function getCurrentFileMovementByEmployeeId(
  employeeId: string
): Promise<FileMovementRecord | null> {
  const movements = await listFileMovementsByEmployeeId(employeeId);

  return (
    movements.find((movement) =>
      ["active", "checked_out", "transferred", "in_transit", "missing"].includes(
        movement.movement_status ?? ""
      )
    ) ?? movements[0] ?? null
  );
}

export type CreateFileMovementInput = {
  employee_id: string | null;
  file_number?: string | null;
  from_department?: string | null;
  to_department?: string | null;
  from_location?: string | null;
  to_location?: string | null;
  from_custodian?: string | null;
  to_custodian?: string | null;
  movement_type: FileMovementAction;
  movement_status?: FileMovementStatus | null;
  movement_reason?: string | null;
  date_sent?: string | null;
  date_received?: string | null;
  remarks?: string | null;
};

export async function createFileMovement(
  input: CreateFileMovementInput,
  actor?: DashboardAuthContext | null
): Promise<FileMovementRecord> {
  const supabase = await createClient();
  const movementStatus = input.movement_status ?? statusForAction(input.movement_type);

  const { data, error } = await supabase
    .from("file_movements")
    .insert({
      employee_id: input.employee_id,
      file_number: toNull(input.file_number),
      movement_status: movementStatus,
      from_department: toNull(input.from_department),
      to_department: toNull(input.to_department),
      from_location: toNull(input.from_location),
      to_location: toNull(input.to_location),
      from_custodian: toNull(input.from_custodian),
      to_custodian: toNull(input.to_custodian),
      movement_reason: toNull(input.movement_reason),
      date_sent: toNull(input.date_sent) ?? new Date().toISOString().slice(0, 10),
      date_received: toNull(input.date_received),
      remarks: toNull(input.remarks),
    })
    .select(FILE_MOVEMENT_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to create file movement: ${error.message}`);
  }

  const [movement] = await enrichFileMovements([data as FileMovementRow]);

  await writeAuditLog({
    module_name: "Physical Files",
    entity_type: "file_movement",
    entity_id: movement.id,
    action_type: "file_movement_created",
    action_summary: `Created ${input.movement_type.replaceAll("_", " ")} file movement.`,
    new_values: movement,
    reason_for_change: toNull(input.movement_reason),
    changed_fields: Object.keys(data ?? {}),
    actor: actor
      ? {
          user_id: actor.user.id,
          display_name: `${actor.profile?.first_name ?? ""} ${actor.profile?.last_name ?? ""}`.trim() || actor.profile?.email || actor.user.email || null,
          role_code: actor.profile?.role_code ?? null,
          role_name: actor.profile?.role_name ?? null,
        }
      : null,
  });

  return movement;
}

export type ApplyFileMovementActionInput = {
  id: string;
  action: FileMovementAction;
  movement_reason?: string;
  from_department?: string;
  to_department?: string;
  from_location?: string;
  to_location?: string;
  from_custodian?: string;
  to_custodian?: string;
  date_received?: string;
  remarks?: string;
};

export async function applyFileMovementAction(
  input: ApplyFileMovementActionInput,
  actor?: DashboardAuthContext | null
): Promise<FileMovementRecord> {
  const supabase = await createClient();
  const previous = await getFileMovementById(input.id);
  const movementStatus = statusForAction(input.action);

  const { data, error } = await supabase
    .from("file_movements")
    .update({
      movement_status: movementStatus,
      movement_reason: toNull(input.movement_reason),
      from_department: toNull(input.from_department),
      to_department: toNull(input.to_department),
      from_location: toNull(input.from_location),
      to_location: toNull(input.to_location),
      from_custodian: toNull(input.from_custodian),
      to_custodian: toNull(input.to_custodian),
      date_received: input.action === "return" ? toNull(input.date_received) ?? new Date().toISOString().slice(0, 10) : toNull(input.date_received),
      remarks: toNull(input.remarks),
    })
    .eq("id", input.id)
    .select(FILE_MOVEMENT_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to apply file movement action: ${error.message}`);
  }

  const [movement] = await enrichFileMovements([data as FileMovementRow]);

  await writeAuditLog({
    module_name: "Physical Files",
    entity_type: "file_movement",
    entity_id: movement.id,
    action_type: "file_movement_updated",
    action_summary: `Applied ${input.action.replaceAll("_", " ")} to physical file movement.`,
    old_values: previous,
    new_values: movement,
    reason_for_change: toNull(input.movement_reason),
    changed_fields: [
      "movement_status",
      "from_department",
      "to_department",
      "from_location",
      "to_location",
      "from_custodian",
      "to_custodian",
      "date_received",
      "remarks",
    ],
    actor: actor
      ? {
          user_id: actor.user.id,
          display_name: `${actor.profile?.first_name ?? ""} ${actor.profile?.last_name ?? ""}`.trim() || actor.profile?.email || actor.user.email || null,
          role_code: actor.profile?.role_code ?? null,
          role_name: actor.profile?.role_name ?? null,
        }
      : null,
  });

  return movement;
}

export async function generateOverdueCheckedOutFileAlerts(): Promise<number> {
  const supabase = await createClient();
  const staleThreshold = new Date();
  staleThreshold.setDate(staleThreshold.getDate() - 14);
  const staleDate = staleThreshold.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("file_movements")
    .select("id, employee_id, file_number, movement_status, date_sent")
    .in("movement_status", ["checked_out", "missing"])
    .order("date_sent", { ascending: false });

  if (error) {
    console.error("generateOverdueCheckedOutFileAlerts error:", error.message);
    return 0;
  }

  const rows = data ?? [];
  const payload = rows.flatMap((row) => {
    const alerts = [];
    if (row.movement_status === "missing") {
      alerts.push({
        correlation_id: `file-missing-${row.id}`,
        alert_title: "Physical File Marked Missing",
        alert_message: `Physical file ${row.file_number ?? row.id} is marked missing.`,
        module_name: "Physical Files",
        severity_level: "critical",
        status: "active",
        entity_type: "file_movement",
        entity_id: row.id,
        employee_id: row.employee_id,
        triggered_at: new Date().toISOString(),
      });
    }

    if (row.movement_status === "checked_out" && row.date_sent && row.date_sent < staleDate) {
      alerts.push({
        correlation_id: `file-stale-checkout-${row.id}`,
        alert_title: "Checked Out File Needs Follow-up",
        alert_message: `Physical file ${row.file_number ?? row.id} has been checked out for more than 14 days.`,
        module_name: "Physical Files",
        severity_level: "warning",
        status: "active",
        entity_type: "file_movement",
        entity_id: row.id,
        employee_id: row.employee_id,
        triggered_at: new Date().toISOString(),
      });
    }

    return alerts;
  });

  if (!payload.length) return 0;

  const { error: alertError } = await supabase
    .from("alerts")
    .upsert(payload, { onConflict: "correlation_id" });

  if (alertError) {
    throw new Error(`Failed to generate file movement alerts: ${alertError.message}`);
  }

  return payload.length;
}

export async function countFilesByMovementStatus(statuses: string[]): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("file_movements")
    .select("id", { head: true, count: "exact" })
    .in("movement_status", statuses);

  if (error) {
    throw new Error(`Failed to count file movements: ${error.message}`);
  }

  return count ?? 0;
}

export async function countOverdueFileReturns(): Promise<number> {
  return 0;
}