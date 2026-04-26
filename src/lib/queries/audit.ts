import { createClient } from "@/lib/supabase/server";
import { headers as nextHeaders } from "next/headers";
import "server-only";

type AuditSupabase = Awaited<ReturnType<typeof createClient>>;
export const ALLOWED_AUDIT_SOURCE_TYPES = [
  "web_ui",
  "api",
  "background_job",
  "migration",
  "system_rule",
] as const;
export type AuditSourceType = (typeof ALLOWED_AUDIT_SOURCE_TYPES)[number];
export const DEFAULT_AUDIT_SOURCE_TYPE: AuditSourceType = "web_ui";

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
  employee_id: string | null;
  ip_address: string | null;
  device_name: string | null;
  computer_name: string | null;
  user_agent: string | null;
  created_at: string | null;
};

/** Audit row with joined employee display fields when `entity_type` is `employee`. */
export type AuditLogWithContext = AuditRecord & {
  related_employee_name: string | null;
  related_employee_number: string | null;
  related_employee_file_number: string | null;
  related_employee_department: string | null;
  related_employee_job_title: string | null;
  related_employee_id: string | null;
  performed_for_display: string;
  performed_by_display_name: string;
  performed_by_email: string | null;
};

export function summarizeChangedFields(
  changedFields: string[] | null | undefined,
  maxFields = 3
): string {
  const fields = (changedFields ?? []).filter(Boolean);
  if (fields.length === 0) return "No changed fields listed";
  if (fields.length <= maxFields) return fields.join(", ");
  return `${fields.slice(0, maxFields).join(", ")} +${fields.length - maxFields} more`;
}

type EmployeeAuditJoinRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  file_number: string | null;
  department: string | null;
  job_title: string | null;
};

type UserProfileAuditJoinRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

export type WriteAuditLogInput = {
  module_name: string;
  entity_type: string;
  entity_id: string;
  action_type: string;
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
  employee_id?: string | null;
  created_at?: string | null;
  actor?: {
    user_id?: string | null;
    display_name?: string | null;
    role_code?: string | null;
    role_name?: string | null;
  } | null;
  ip_address?: string | null;
  device_name?: string | null;
  computer_name?: string | null;
  user_agent?: string | null;
};

function normalizeAuditSourceType(value: string | null | undefined): AuditSourceType {
  const candidate = (value ?? "").trim().toLowerCase();
  return (ALLOWED_AUDIT_SOURCE_TYPES as readonly string[]).includes(candidate)
    ? (candidate as AuditSourceType)
    : DEFAULT_AUDIT_SOURCE_TYPE;
}
// SQL guidance for optional metadata columns:
// alter table public.audit_logs
// add column if not exists ip_address text,
// add column if not exists device_name text,
// add column if not exists user_agent text;
// Optional employee context guidance:
// alter table public.audit_logs
// add column if not exists employee_id uuid references public.employees(id) on delete set null;

const AUDIT_BASE_SELECT = `
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

type AuditColumnSupport = {
  employee_id: boolean;
  ip_address: boolean;
  device_name: boolean;
  computer_name: boolean;
  user_agent: boolean;
};

let auditColumnSupportCache: AuditColumnSupport | null = null;

function formatEmployeeDisplayName(row: EmployeeAuditJoinRow): string | null {
  const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
  return name || null;
}

function formatUserProfileDisplayName(
  profile: Pick<UserProfileAuditJoinRow, "first_name" | "last_name">
): string | null {
  const first = profile.first_name?.trim() ?? "";
  const last = profile.last_name?.trim() ?? "";
  const full = `${first} ${last}`.trim();
  return full || null;
}

async function hasAuditColumn(supabase: AuditSupabase, column: keyof AuditColumnSupport): Promise<boolean> {
  const { error } = await supabase.from("audit_logs").select(column).limit(1);
  return !error;
}

async function getAuditColumnSupport(supabase: AuditSupabase): Promise<AuditColumnSupport> {
  if (auditColumnSupportCache) return auditColumnSupportCache;
  const [employee_id, ip_address, device_name, computer_name, user_agent] = await Promise.all([
    hasAuditColumn(supabase, "employee_id"),
    hasAuditColumn(supabase, "ip_address"),
    hasAuditColumn(supabase, "device_name"),
    hasAuditColumn(supabase, "computer_name"),
    hasAuditColumn(supabase, "user_agent"),
  ]);
  auditColumnSupportCache = {
    employee_id,
    ip_address,
    device_name,
    computer_name,
    user_agent,
  };
  return auditColumnSupportCache;
}

function getAuditSelectClause(columns: AuditColumnSupport): string {
  const optional = [
    columns.employee_id ? "employee_id" : null,
    columns.ip_address ? "ip_address" : null,
    columns.device_name ? "device_name" : null,
    columns.computer_name ? "computer_name" : null,
    columns.user_agent ? "user_agent" : null,
  ]
    .filter(Boolean)
    .join(",\n  ");
  return optional ? `${AUDIT_BASE_SELECT},\n  ${optional}` : AUDIT_BASE_SELECT;
}

function normalizeIpAddress(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first || null;
}

function toObject(value: AuditJson): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function inferRelatedEmployeeId(log: AuditRecord): string | null {
  if (log.employee_id) return log.employee_id;
  if (log.entity_type?.toLowerCase() === "employee" && log.entity_id) return log.entity_id;
  const oldObject = toObject(log.old_values);
  const newObject = toObject(log.new_values);
  const fromNew = typeof newObject.employee_id === "string" ? newObject.employee_id : null;
  if (fromNew) return fromNew;
  const fromOld = typeof oldObject.employee_id === "string" ? oldObject.employee_id : null;
  return fromOld;
}

function buildDeviceLabelFromUserAgent(userAgent: string | null): string | null {
  const ua = (userAgent ?? "").toLowerCase();
  if (!ua) return null;
  const browser = ua.includes("edg/")
    ? "Edge"
    : ua.includes("chrome/")
      ? "Chrome"
      : ua.includes("safari/") && !ua.includes("chrome/")
        ? "Safari"
        : ua.includes("firefox/")
          ? "Firefox"
          : "Browser";
  const device = ua.includes("iphone")
    ? "iPhone"
    : ua.includes("ipad")
      ? "iPad"
      : ua.includes("android")
        ? "Android"
        : ua.includes("mac os")
          ? "macOS"
          : ua.includes("windows")
            ? "Windows"
            : ua.includes("linux")
              ? "Linux"
              : "Device";
  return `${browser} on ${device}`;
}

export function getAuditRequestContext(input?: { headers?: Headers | null }): {
  ip_address: string | null;
  user_agent: string | null;
  device_name: string | null;
} {
  const headers = input?.headers;
  const forwardedFor = headers?.get("x-forwarded-for");
  const realIp = headers?.get("x-real-ip");
  const cloudflareIp = headers?.get("cf-connecting-ip");
  const userAgent = headers?.get("user-agent")?.trim() || null;
  const ipAddress =
    normalizeIpAddress(forwardedFor) ??
    normalizeIpAddress(realIp) ??
    normalizeIpAddress(cloudflareIp);
  return {
    ip_address: ipAddress,
    user_agent: userAgent,
    // Browser apps cannot reliably read the real Windows device name;
    // use a UA-derived label as a safe device name fallback.
    device_name: buildDeviceLabelFromUserAgent(userAgent) ?? userAgent,
  };
}

async function attachRelatedEmployeeContext(
  supabase: AuditSupabase,
  logs: AuditRecord[]
): Promise<AuditLogWithContext[]> {
  const employeeIds = [
    ...new Set(
      logs
        .map((log) => inferRelatedEmployeeId(log))
        .filter((value): value is string => Boolean(value))
    ),
  ];

  let byId = new Map<string, EmployeeAuditJoinRow>();
  if (employeeIds.length > 0) {
    const { data, error } = await supabase
      .from("employees")
      .select("id, first_name, last_name, file_number, department, job_title")
      .in("id", employeeIds);

    if (error) {
      console.error("attachRelatedEmployeeContext employees error:", error);
      throw new Error(`Failed to load related employees for audit: ${error.message}`);
    }

    byId = new Map((data ?? []).map((row) => [row.id, row as EmployeeAuditJoinRow]));
  }

  const performerUserIds = [
    ...new Set(
      logs
        .map((log) => log.performed_by_user_id)
        .filter((value): value is string => Boolean(value))
    ),
  ];
  let performersById = new Map<string, UserProfileAuditJoinRow>();
  if (performerUserIds.length > 0) {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("id, first_name, last_name, email")
      .in("id", performerUserIds);

    if (error) {
      console.error("attachRelatedEmployeeContext user_profiles error:", error);
      throw new Error(
        `Failed to load performer profiles for audit: ${error.message}`
      );
    }
    performersById = new Map(
      (data ?? []).map((row) => [row.id, row as UserProfileAuditJoinRow])
    );
  }

  return logs.map((log) => {
    const relatedEmployeeId = inferRelatedEmployeeId(log);
    const emp = relatedEmployeeId ? byId.get(relatedEmployeeId) : undefined;
    const performer = log.performed_by_user_id
      ? performersById.get(log.performed_by_user_id)
      : undefined;
    const performerNameFromProfile = performer
      ? formatUserProfileDisplayName(performer)
      : null;
    const performedByDisplayName =
      performerNameFromProfile ??
      log.performed_by_name?.trim() ??
      performer?.email?.trim() ??
      "System";
    return {
      ...log,
      related_employee_name: emp ? formatEmployeeDisplayName(emp) : null,
      related_employee_number: emp?.file_number ?? null,
      related_employee_file_number: emp?.file_number ?? null,
      related_employee_department: emp?.department ?? null,
      related_employee_job_title: emp?.job_title ?? null,
      related_employee_id: relatedEmployeeId,
      performed_for_display: emp
        ? `${formatEmployeeDisplayName(emp) ?? "Unknown"} — File #${emp.file_number ?? "—"}`
        : "Not employee-specific",
      performed_by_display_name: performedByDisplayName,
      performed_by_email: performer?.email?.trim() ?? null,
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
  const supportedColumns = await getAuditColumnSupport(supabase);
  const auditSelect = getAuditSelectClause(supportedColumns);
  const actorUserId = input.actor?.user_id ?? null;
  const actorDisplayName = input.actor?.display_name?.trim() || null;
  const actorRole = input.actor?.role_code ?? input.actor?.role_name ?? null;

  const payload: Record<string, unknown> = {
    module_name: input.module_name,
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    action_type: input.action_type,
    action_summary: input.action_summary,
    old_values: input.old_values ?? null,
    new_values: input.new_values ?? null,
    source_type: normalizeAuditSourceType(input.source_type),
    performed_by_name: input.performed_by_name ?? actorDisplayName ?? null,
    performed_by_user_id: input.performed_by_user_id ?? actorUserId,
    role_at_time: input.role_at_time ?? actorRole,
    event_timestamp: input.event_timestamp ?? input.created_at ?? new Date().toISOString(),
    reason_for_change: input.reason_for_change ?? null,
    correlation_id: input.correlation_id ?? null,
    is_sensitive: input.is_sensitive ?? false,
    changed_fields: input.changed_fields ?? null,
    employee_id: input.employee_id ?? null,
    created_at: input.created_at ?? new Date().toISOString(),
  };
  if (!supportedColumns.employee_id) {
    delete payload.employee_id;
  }
  let autoContext: ReturnType<typeof getAuditRequestContext> | null = null;
  if (!input.ip_address || !input.user_agent || !input.device_name) {
    try {
      autoContext = getAuditRequestContext({ headers: await nextHeaders() });
    } catch {
      autoContext = null;
    }
  }
  if (supportedColumns.ip_address) {
    payload.ip_address = normalizeIpAddress(input.ip_address ?? autoContext?.ip_address);
  }
  if (supportedColumns.device_name) {
    payload.device_name =
      input.device_name?.trim() ||
      autoContext?.device_name?.trim() ||
      buildDeviceLabelFromUserAgent(input.user_agent ?? autoContext?.user_agent ?? null) ||
      input.user_agent?.trim() ||
      autoContext?.user_agent?.trim() ||
      null;
  }
  if (supportedColumns.computer_name) {
    payload.computer_name = input.computer_name?.trim() || null;
  }
  if (supportedColumns.user_agent) {
    payload.user_agent = input.user_agent?.trim() || autoContext?.user_agent?.trim() || null;
  }

  const { data, error } = await supabase
    .from("audit_logs")
    .insert(payload)
    .select(auditSelect)
    .single();

  if (error) {
    const finalErrorMessage =
      typeof error === "object" && error && "message" in error
        ? String(error.message ?? "Unknown audit log error")
        : "Unknown audit log error";
    console.error("writeAuditLog error:", error);
    throw new Error(`Failed to write audit log: ${finalErrorMessage}`);
  }

  return data as unknown as AuditRecord;
}

/** Recent audit logs, newest event first, with optional employee scoping. */
export async function listRecentAuditLogs(
  limit = 100,
  employeeId?: string
): Promise<AuditLogWithContext[]> {
  const supabase = await createClient();
  const supportedColumns = await getAuditColumnSupport(supabase);
  const auditSelect = getAuditSelectClause(supportedColumns);
  let query = supabase
    .from("audit_logs")
    .select(auditSelect)
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

  const sorted = sortAuditLogsByEventTimeDesc((data ?? []) as unknown as AuditRecord[]);
  return attachRelatedEmployeeContext(supabase, sorted);
}

/** Single audit log with related employee context when applicable. */
export async function getAuditLogById(id: string): Promise<AuditLogWithContext | null> {
  const supabase = await createClient();
  const supportedColumns = await getAuditColumnSupport(supabase);
  const auditSelect = getAuditSelectClause(supportedColumns);
  const { data, error } = await supabase
    .from("audit_logs")
    .select(auditSelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getAuditLogById error:", error);
    throw new Error(`Failed to load audit record: ${error.message}`);
  }

  if (!data) return null;
  const enriched = await attachRelatedEmployeeContext(supabase, [
    data as unknown as AuditRecord,
  ]);
  return enriched[0] ?? null;
}

/** Chronological timeline for a specific entity across repeated changes. */
export async function listAuditTimelineForEntity(
  entityType: string,
  entityId: string,
  limit = 100
): Promise<AuditLogWithContext[]> {
  const supabase = await createClient();
  const supportedColumns = await getAuditColumnSupport(supabase);
  const auditSelect = getAuditSelectClause(supportedColumns);
  const { data, error } = await supabase
    .from("audit_logs")
    .select(auditSelect)
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("event_timestamp", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("listAuditTimelineForEntity error:", error);
    throw new Error(`Failed to load audit timeline: ${error.message}`);
  }

  const sorted = sortAuditLogsByEventTimeDesc((data ?? []) as unknown as AuditRecord[]);
  return attachRelatedEmployeeContext(supabase, sorted);
}

/** Audit history for a specific employee record (`entity_type = employee`, `entity_id` = profile id). */
export async function listAuditLogsByEmployeeId(
  employeeId: string
): Promise<AuditLogWithContext[]> {
  const supabase = await createClient();
  const supportedColumns = await getAuditColumnSupport(supabase);
  const auditSelect = getAuditSelectClause(supportedColumns);
  const { data, error } = await supabase
    .from("audit_logs")
    .select(auditSelect)
    .eq("entity_type", "employee")
    .eq("entity_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAuditLogsByEmployeeId error:", error);
    throw new Error(`Failed to load employee audit history: ${error.message}`);
  }

  const sorted = sortAuditLogsByEventTimeDesc((data ?? []) as unknown as AuditRecord[]);
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
