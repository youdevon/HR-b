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
  severity_level: string | null;
  status: string | null;
  triggered_at: string | null;
  employee_id: string | null;
  resolved_at: string | null;
  resolution_notes: string | null;
};

export type AlertDetailRecord = AlertRecord & {
  correlation_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  created_at: string | null;
  updated_at: string | null;
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
  severity_level,
  status,
  triggered_at,
  employee_id,
  resolved_at,
  resolution_notes
`;

const ALERT_DETAIL_SELECT = `
  id,
  alert_title,
  alert_message,
  module_name,
  severity_level,
  status,
  triggered_at,
  employee_id,
  resolved_at,
  resolution_notes,
  correlation_id,
  entity_type,
  entity_id,
  created_at,
  updated_at
`;

export async function listActiveAlerts(
  filters?: ActiveAlertFilters
): Promise<AlertRecord[]> {
  const supabase = await createClient();

  let query = supabase
    .from("alerts")
    .select(ALERT_SELECT)
    .in("status", ["active", "acknowledged"])
    .order("triggered_at", { ascending: false });

  const severity = filters?.severity_level?.trim();
  if (severity) {
    query = query.eq("severity_level", severity);
  }

  const status = filters?.status?.trim().toLowerCase();
  if (status === "active" || status === "acknowledged") {
    query = query.eq("status", status);
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

  return data ?? [];
}

function severitySortRank(level: string | null): number {
  const normalized = (level ?? "").toLowerCase();
  if (normalized === "critical") return 0;
  if (normalized === "warning") return 1;
  return 2;
}

export async function listPriorityAlerts(limit = 5): Promise<AlertRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_SELECT)
    .in("status", ["active", "acknowledged"])
    .order("triggered_at", { ascending: false })
    .limit(80);

  if (error) {
    console.error("listPriorityAlerts error:", error);
    throw new Error(`Failed to load priority alerts: ${error.message}`);
  }

  const rows = [...(data ?? [])];
  rows.sort((a, b) => {
    const rankDiff =
      severitySortRank(a.severity_level) - severitySortRank(b.severity_level);
    if (rankDiff !== 0) return rankDiff;
    const ta = new Date(a.triggered_at ?? 0).getTime();
    const tb = new Date(b.triggered_at ?? 0).getTime();
    return tb - ta;
  });

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
          resolution_notes: before.resolution_notes,
          severity_level: before.severity_level,
        }
      : null,
    new_values: {
      status: data.status,
      resolved_at: data.resolved_at,
      resolution_notes: data.resolution_notes,
      severity_level: data.severity_level,
    },
    source_type: "application",
  });

  return data;
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
          resolution_notes: before.resolution_notes,
          severity_level: before.severity_level,
        }
      : null,
    new_values: {
      status: data.status,
      resolved_at: data.resolved_at,
      resolution_notes: data.resolution_notes,
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