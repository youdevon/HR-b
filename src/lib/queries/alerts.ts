import {
  listAlertRules as listConfigurableAlertRules,
  type AlertRuleRecord,
} from "@/lib/queries/alert-rules";
import { writeAuditLog } from "@/lib/queries/audit";
import { generateAllSystemAlerts } from "@/lib/queries/notifications";
import { createClient } from "@/lib/supabase/server";

export type AlertRecord = {
  id: string;
  alert_title: string | null;
  alert_message: string | null;
  module_name: string | null;
  entity_type: string | null;
  entity_id: string | null;
  severity_level: string | null;
  status: string | null;
  correlation_id: string | null;
  triggered_at: string | null;
  updated_at: string | null;
  acknowledged_at: string | null;
  employee_id: string | null;
  resolved_at: string | null;
  resolution_notes?: string | null;
};

export type ActiveAlertListItem = AlertRecord & {
  employee_name: string | null;
  employee_file_number: string | null;
  alert_category: string;
  related_record_href: string | null;
};

export type AlertDetailRecord = AlertRecord & {
  created_at: string | null;
};

export type ActiveAlertFilters = {
  severity_level?: string;
  status?: string;
  module_name?: string;
};

const ALERT_SELECT = `
  id,
  alert_title,
  alert_message,
  module_name,
  entity_type,
  entity_id,
  severity_level,
  status,
  correlation_id,
  triggered_at,
  updated_at,
  acknowledged_at,
  employee_id,
  resolved_at
`;

const ALERT_DETAIL_SELECT = `
  id,
  alert_title,
  alert_message,
  module_name,
  severity_level,
  status,
  correlation_id,
  triggered_at,
  updated_at,
  acknowledged_at,
  employee_id,
  resolved_at,
  entity_type,
  entity_id,
  created_at
`;

function severitySortRank(level: string | null): number {
  const normalized = (level ?? "").toLowerCase();
  if (normalized === "critical") return 0;
  if (normalized === "warning") return 1;
  return 2;
}

function buildRelatedRecordHref(alert: Pick<AlertRecord, "module_name" | "entity_type" | "entity_id">): string | null {
  if (!alert.entity_id) return null;
  const moduleName = (alert.module_name ?? "").trim().toLowerCase();
  const entityType = (alert.entity_type ?? "").trim().toLowerCase();

  if (moduleName === "contracts" || entityType === "contract") {
    return `/contracts/${alert.entity_id}`;
  }
  if (moduleName === "leave" && entityType === "leave_transaction") {
    return `/leave/${alert.entity_id}`;
  }
  if (moduleName === "leave" && entityType === "leave_balance") {
    return "/leave/balances";
  }
  if (moduleName === "physical files" || entityType === "file_movement") {
    return `/file-movements/${alert.entity_id}`;
  }
  if (moduleName === "gratuity" || entityType === "gratuity_calculation") {
    return `/gratuity/${alert.entity_id}`;
  }
  return null;
}

function deriveAlertCategory(alert: Pick<AlertRecord, "correlation_id" | "entity_type" | "module_name">): string {
  const correlationPrefix = String(alert.correlation_id ?? "")
    .trim()
    .toLowerCase()
    .split("-")[0];
  if (correlationPrefix) return correlationPrefix.replaceAll("_", " ");
  return (
    (alert.entity_type ?? "").trim() ||
    (alert.module_name ?? "").trim() ||
    "general"
  );
}

export async function listActiveAlerts(
  filters?: ActiveAlertFilters
): Promise<ActiveAlertListItem[]> {
  const supabase = await createClient();

  const normalizedStatus = (filters?.status ?? "").trim().toLowerCase();
  const effectiveStatus =
    normalizedStatus === "acknowledged" ? "acknowledged" : "active";

  let query = supabase
    .from("alerts")
    .select(ALERT_SELECT)
    .eq("status", effectiveStatus)
    .order("triggered_at", { ascending: false });

  const severity = filters?.severity_level?.trim();
  if (severity) {
    query = query.eq("severity_level", severity);
  }

  const moduleName = filters?.module_name?.trim();
  if (moduleName) {
    query = query.eq("module_name", moduleName);
  }

  const { data, error } = await query;

  if (error) {
    console.error("listActiveAlerts error:", error);
    throw new Error(`Failed to load active alerts: ${error.message}`);
  }

  const rows = (data ?? []) as AlertRecord[];
  const employeeIds = [
    ...new Set(
      rows
        .map((row) => row.employee_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const employeeById = new Map<
    string,
    { first_name: string | null; last_name: string | null; file_number: string | null }
  >();
  if (employeeIds.length > 0) {
    const { data: employees, error: employeesError } = await supabase
      .from("employees")
      .select("id, first_name, last_name, file_number")
      .in("id", employeeIds);
    if (employeesError) {
      throw new Error(`Failed to load alert employee context: ${employeesError.message}`);
    }
    for (const employee of employees ?? []) {
      employeeById.set(String(employee.id), {
        first_name: employee.first_name ?? null,
        last_name: employee.last_name ?? null,
        file_number: employee.file_number ?? null,
      });
    }
  }

  const enriched = rows.map((row) => {
    const employee = row.employee_id ? employeeById.get(row.employee_id) : undefined;
    const employeeName = employee
      ? `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim() || null
      : null;
    return {
      ...row,
      employee_name: employeeName,
      employee_file_number: employee?.file_number ?? null,
      alert_category: deriveAlertCategory(row),
      related_record_href: buildRelatedRecordHref(row),
    };
  });

  enriched.sort((a, b) => {
    const severityDiff = severitySortRank(a.severity_level) - severitySortRank(b.severity_level);
    if (severityDiff !== 0) return severityDiff;
    const ta = new Date(a.triggered_at ?? 0).getTime();
    const tb = new Date(b.triggered_at ?? 0).getTime();
    return tb - ta;
  });

  return enriched;
}

export async function listPriorityAlerts(limit = 5): Promise<ActiveAlertListItem[]> {
  const rows = await listActiveAlerts({ status: "active" });
  return rows.slice(0, limit);
}

export async function listResolvedAlerts(): Promise<AlertRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_SELECT)
    .eq("status", "resolved")
    .order("resolved_at", { ascending: false })
    .order("triggered_at", { ascending: false });

  if (error) {
    console.error("listResolvedAlerts error:", error);
    throw new Error(`Failed to load resolved alerts: ${error.message}`);
  }

  return data ?? [];
}

export async function getAlertById(id: string): Promise<AlertDetailRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getAlertById error:", error);
    throw new Error(`Failed to load alert: ${error.message}`);
  }

  return data ?? null;
}

export async function acknowledgeAlert(id: string): Promise<AlertRecord> {
  const supabase = await createClient();
  const before = await getAlertById(id);
  const { data, error } = await supabase
    .from("alerts")
    .update({
      status: "acknowledged",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(ALERT_SELECT)
    .single();

  if (error) {
    console.error("acknowledgeAlert error:", error);
    throw new Error(`Failed to acknowledge alert: ${error.message}`);
  }

  await writeAuditLog({
    module_name: "Alerts",
    entity_type: "alert",
    entity_id: data.id,
    action_type: "alert_acknowledged",
    action_summary: `Acknowledged alert ${data.alert_title ?? data.id}.`,
    old_values: before
      ? {
          status: before.status,
          resolved_at: before.resolved_at,
          severity_level: before.severity_level,
        }
      : null,
    new_values: {
      status: data.status,
      resolved_at: data.resolved_at,
      severity_level: data.severity_level,
    },
    source_type: "application",
  });

  return data;
}

export async function markContractExpiryReviewed(
  contractId: string
): Promise<number> {
  const scopedContractId = contractId.trim();
  if (!scopedContractId) return 0;

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("alerts")
    .select("id, correlation_id")
    .eq("module_name", "Contracts")
    .eq("entity_type", "contract")
    .eq("entity_id", scopedContractId)
    .eq("status", "active");

  if (loadError) {
    throw new Error(`Failed to load contract alerts: ${loadError.message}`);
  }

  const expiryPrefixes = [
    "contract_expiring-",
    "contract_expiring_critical-",
    "contracts_expiring_in_30_days-",
    "contracts_expiring_in_90_days-",
    "expired_contracts-",
  ];

  const alertIds = (existing ?? [])
    .filter((row) => {
      const correlationId = String(row.correlation_id ?? "").toLowerCase();
      return expiryPrefixes.some((prefix) => correlationId.startsWith(prefix));
    })
    .map((row) => String(row.id ?? ""))
    .filter(Boolean);
  if (alertIds.length === 0) return 0;

  const now = new Date().toISOString();
  const updateWithTimestamp = await supabase
    .from("alerts")
    .update({
      status: "acknowledged",
      updated_at: now,
    })
    .in("id", alertIds);

  if (!updateWithTimestamp.error) {
    return alertIds.length;
  }

  const message = updateWithTimestamp.error.message.toLowerCase();
  const missingUpdatedAt = message.includes("updated_at") && message.includes("column");
  if (!missingUpdatedAt) {
    throw new Error(
      `Failed to acknowledge contract alerts: ${updateWithTimestamp.error.message}`
    );
  }

  const fallbackUpdate = await supabase
    .from("alerts")
    .update({
      status: "acknowledged",
    })
    .in("id", alertIds);

  if (fallbackUpdate.error) {
    throw new Error(`Failed to acknowledge contract alerts: ${fallbackUpdate.error.message}`);
  }

  return alertIds.length;
}

export async function acknowledgeContractAlertsByContractId(
  contractId: string
): Promise<number> {
  return markContractExpiryReviewed(contractId);
}

export async function resolveAlert(
  id: string,
  resolutionNotes?: string
): Promise<AlertRecord> {
  const supabase = await createClient();
  const before = await getAlertById(id);
  const { data, error } = await supabase
    .from("alerts")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(ALERT_SELECT)
    .single();

  if (error) {
    console.error("resolveAlert error:", error);
    throw new Error(`Failed to resolve alert: ${error.message}`);
  }

  await writeAuditLog({
    module_name: "Alerts",
    entity_type: "alert",
    entity_id: data.id,
    action_type: "alert_resolved",
    action_summary: `Resolved alert ${data.alert_title ?? data.id}.`,
    old_values: before
      ? {
          status: before.status,
          resolved_at: before.resolved_at,
          severity_level: before.severity_level,
        }
      : null,
    new_values: {
      status: data.status,
      resolved_at: data.resolved_at,
      severity_level: data.severity_level,
    },
    source_type: "application",
  });

  return data;
}

export async function listAlertRules(): Promise<AlertRuleRecord[]> {
  return listConfigurableAlertRules();
}

export async function generateContractExpiryAlerts(): Promise<{
  scannedContracts: number;
  upsertedAlerts: number;
}> {
  const counts = await generateAllSystemAlerts();
  return { scannedContracts: 0, upsertedAlerts: counts.total };
}