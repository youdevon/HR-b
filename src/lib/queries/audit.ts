import { createClient } from "@/lib/supabase/server";
import "server-only";

type AuditSupabase = Awaited<ReturnType<typeof createClient>>;

export type AuditJson = Record<string, unknown> | null;

export type AuditRecord = {
  id: string;
  module_name: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
  action_summary: string;
  old_values: AuditJson;
  new_values: AuditJson;
  source_type: string;
  performed_by_name: string | null;
  performed_by_user_id: string | null;
  role_at_time: string | null;
  event_timestamp: string | null;
  reason_for_change: string | null;
  correlation_id: string | null;
  is_sensitive: boolean | null;
  changed_fields: string[] | null;
  created_at: string | null;
};

/** Audit row with joined employee display fields when `entity_type` is `employee`. */
export type AuditLogWithContext = AuditRecord & {
  related_employee_name: string | null;
  related_employee_number: string | null;
};

type EmployeeAuditJoinRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  employee_number: string | null;
};

export type WriteAuditLogInput = {
  module_name: string;
  entity_type: string;
  entity_id: string;
  action_type:
    | "employee_created"
    | "employee_updated"
    | "file_movement_created"
    | "file_movement_updated"
    | "alert_acknowledged"
    | "alert_resolved";
  action_summary: string;
  old_values?: AuditJson;
  new_values?: AuditJson;
  source_type?: string;
  performed_by_name?: string | null;
  performed_by_user_id?: string | null;
  role_at_time?: string | null;
  event_timestamp?: string | null;
  reason_for_change?: string | null;
  correlation_id?: string | null;
  is_sensitive?: boolean | null;
  changed_fields?: string[] | null;
  created_at?: string | null;
};

const AUDIT_SELECT = `
  id,
  module_name,
  entity_type,
  entity_id,
  action_type,
  action_summary,
  old_values,
  new_values,
  source_type,
  performed_by_name,
  performed_by_user_id,
  role_at_time,
  event_timestamp,
  reason_for_change,
  correlation_id,
  is_sensitive,
  changed_fields,
  created_at
`;

function formatEmployeeDisplayName(row: EmployeeAuditJoinRow): string | null {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

async function attachRelatedEmployeeContext(
  supabase: AuditSupabase,
  logs: AuditRecord[]
): Promise<AuditLogWithContext[]> {
  const employeeIds = [
    ...new Set(
      logs
        .filter((log) => log.entity_type?.toLowerCase() === "employee" && log.entity_id)
        .map((log) => log.entity_id)
    ),
  ];

  let byId = new Map<string, EmployeeAuditJoinRow>();
  if (employeeIds.length > 0) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name, employee_number")
      .in("id", employeeIds);

    if (error) {
      console.error("attachRelatedEmployeeContext employees error:", error);
      throw new Error(`Failed to load related employees for audit: ${error.message}`);
    }

    byId = new Map((data ?? []).map((row) => [row.id, row as EmployeeAuditJoinRow]));
  }

  return logs.map((log) => {
    const isEmployee = log.entity_type?.toLowerCase() === "employee";
    const emp = isEmployee ? byId.get(log.entity_id) : undefined;
    return {
      ...log,
      related_employee_name: emp ? formatEmployeeDisplayName(emp) : null,
      related_employee_number: emp?.employee_number ?? null,
    };
  });
}

function sortAuditLogsByEventTimeDesc(logs: AuditRecord[]): AuditRecord[] {
  return [...logs].sort((a, b) => {
    const ta = new Date(a.event_timestamp ?? a.created_at ?? 0).getTime();
    const tb = new Date(b.event_timestamp ?? b.created_at ?? 0).getTime();
    return tb - ta;
  });
}

export async function writeAuditLog(input: WriteAuditLogInput): Promise<AuditRecord> {
  const supabase = await createClient();

  const payload = {
    module_name: input.module_name,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    action_type: input.action_type,
    action_summary: input.action_summary,
    old_values: input.old_values ?? null,
    new_values: input.new_values ?? null,
    source_type: input.source_type ?? "application",
    performed_by_name: input.performed_by_name ?? null,
    performed_by_user_id: input.performed_by_user_id ?? null,
    role_at_time: input.role_at_time ?? null,
    event_timestamp: input.event_timestamp ?? new Date().toISOString(),
    reason_for_change: input.reason_for_change ?? null,
    correlation_id: input.correlation_id ?? null,
    is_sensitive: input.is_sensitive ?? false,
    changed_fields: input.changed_fields ?? null,
    created_at: input.created_at ?? null,
  };

  const { data, error } = await supabase
    .from("audit_logs")
    .insert(payload)
    .select(AUDIT_SELECT)
    .single();

  if (error) {
    console.error("writeAuditLog error:", error);
    throw new Error(`Failed to write audit log: ${error.message}`);
  }

  return data;
}

/** Recent audit logs, newest event first, with optional employee scoping. */
export async function listRecentAuditLogs(
  limit = 100,
  employeeId?: string
): Promise<AuditLogWithContext[]> {
  const supabase = await createClient();
  let query = supabase
    .from("audit_logs")
    .select(AUDIT_SELECT)
    .order("event_timestamp", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  const scopedEmployeeId = employeeId?.trim();
  if (scopedEmployeeId) {
    query = query.eq("entity_type", "employee").eq("entity_id", scopedEmployeeId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listRecentAuditLogs error:", error);
    throw new Error(`Failed to load audit activity: ${error.message}`);
  }

  const sorted = sortAuditLogsByEventTimeDesc(data ?? []);
  return attachRelatedEmployeeContext(supabase, sorted);
}

/** Single audit log with related employee context when applicable. */
export async function getAuditLogById(id: string): Promise<AuditLogWithContext | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getAuditLogById error:", error);
    throw new Error(`Failed to load audit record: ${error.message}`);
  }

  if (!data) return null;
  const enriched = await attachRelatedEmployeeContext(supabase, [data]);
  return enriched[0] ?? null;
}

/** Chronological timeline for a specific entity across repeated changes. */
export async function listAuditTimelineForEntity(
  entityType: string,
  entityId: string,
  limit = 100
): Promise<AuditLogWithContext[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_SELECT)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("event_timestamp", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listAuditTimelineForEntity error:", error);
    throw new Error(`Failed to load audit timeline: ${error.message}`);
  }

  const sorted = sortAuditLogsByEventTimeDesc(data ?? []);
  return attachRelatedEmployeeContext(supabase, sorted);
}

/** Audit history for a specific employee record (`entity_type = employee`, `entity_id` = profile id). */
export async function listAuditLogsByEmployeeId(
  employeeId: string
): Promise<AuditLogWithContext[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select(AUDIT_SELECT)
    .eq("entity_type", "employee")
    .eq("entity_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAuditLogsByEmployeeId error:", error);
    throw new Error(`Failed to load employee audit history: ${error.message}`);
  }

  const sorted = sortAuditLogsByEventTimeDesc(data ?? []);
  return attachRelatedEmployeeContext(supabase, sorted);
}

/** @deprecated Use {@link listRecentAuditLogs} instead. */
export async function listAuditActivity(
  limit = 50,
  employeeId?: string
): Promise<AuditLogWithContext[]> {
  return listRecentAuditLogs(limit, employeeId);
}

/** @deprecated Use {@link getAuditLogById} instead. */
export async function getAuditById(id: string): Promise<AuditLogWithContext | null> {
  return getAuditLogById(id);
}
