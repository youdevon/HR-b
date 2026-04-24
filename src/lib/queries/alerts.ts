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

export type AlertRuleRecord = {
  id: string;
  rule_name: string | null;
  module_name: string | null;
  condition_expression: string | null;
  severity_level: string | null;
  is_active: boolean | null;
  created_at: string | null;
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

const ALERT_RULE_SELECT = `
  id,
  rule_name,
  module_name,
  condition_expression,
  severity_level,
  is_active,
  created_at
`;

export async function listActiveAlerts(): Promise<AlertRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_SELECT)
    .in("status", ["active", "acknowledged"])
    .order("triggered_at", { ascending: false });

  if (error) {
    console.error("listActiveAlerts error:", error);
    throw new Error(`Failed to load active alerts: ${error.message}`);
  }

  return data ?? [];
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

export async function getAlertById(id: string): Promise<AlertRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .select(ALERT_SELECT)
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
  const { data, error } = await supabase
    .from("alerts")
    .update({ status: "acknowledged" })
    .eq("id", id)
    .select(ALERT_SELECT)
    .single();

  if (error) {
    console.error("acknowledgeAlert error:", error);
    throw new Error(`Failed to acknowledge alert: ${error.message}`);
  }

  return data;
}

export async function resolveAlert(
  id: string,
  resolutionNotes?: string
): Promise<AlertRecord> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alerts")
    .update({
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolution_notes: resolutionNotes?.trim() || null,
    })
    .eq("id", id)
    .select(ALERT_SELECT)
    .single();

  if (error) {
    console.error("resolveAlert error:", error);
    throw new Error(`Failed to resolve alert: ${error.message}`);
  }

  return data;
}

export async function listAlertRules(): Promise<AlertRuleRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alert_rules")
    .select(ALERT_RULE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listAlertRules error:", error);
    throw new Error(`Failed to load alert rules: ${error.message}`);
  }

  return data ?? [];
}

type ContractForAlert = {
  id: string;
  employee_id: string | null;
  contract_number: string | null;
  end_date: string | null;
  contract_status: string | null;
};

type ContractExpiryAlertPayload = {
  correlation_id: string;
  alert_title: string;
  alert_message: string;
  module_name: string;
  severity_level: "critical" | "warning";
  status: "active";
  entity_type: "contract";
  entity_id: string;
  employee_id: string | null;
  triggered_at: string;
};

function localDateAtMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function parseLocalDate(dateText: string): Date | null {
  const [yearText, monthText, dayText] = dateText.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function dateStringInDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function generateContractExpiryAlerts(): Promise<{
  scannedContracts: number;
  upsertedAlerts: number;
}> {
  const supabase = await createClient();
  const today = localDateAtMidnight();
  const within30Days = dateStringInDays(30);

  const { data, error } = await supabase
    .from("contracts")
    .select("id, employee_id, contract_number, end_date, contract_status")
    .not("end_date", "is", null)
    .eq("contract_status", "active")
    .lte("end_date", within30Days);

  if (error) {
    console.error("generateContractExpiryAlerts load contracts error:", error);
    throw new Error(`Failed to load contracts for alert generation: ${error.message}`);
  }

  const contracts = (data ?? []) as ContractForAlert[];
  const payload: ContractExpiryAlertPayload[] = [];

  for (const contract of contracts) {
    if (!contract.end_date) continue;
    const endDate = parseLocalDate(contract.end_date);
    if (!endDate) continue;

    const dayDelta = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    let severity: "critical" | "warning" | null = null;
    let title = "";
    let correlationId = "";

    if (dayDelta < 0) {
      severity = "critical";
      title = "Contract Expired";
      correlationId = `contract-expired-${contract.id}`;
    } else if (dayDelta <= 7) {
      severity = "critical";
      title = "Contract Expiring Soon";
      correlationId = `contract-expiring-${contract.id}`;
    } else if (dayDelta <= 30) {
      severity = "warning";
      title = "Contract Expiring in 30 Days";
      correlationId = `contract-expiring-${contract.id}`;
    }

    if (!severity || !correlationId) continue;

    payload.push({
      correlation_id: correlationId,
      alert_title: title,
      alert_message: `Contract ${contract.contract_number ?? contract.id} ends on ${contract.end_date}.`,
      module_name: "Contracts",
      severity_level: severity,
      status: "active",
      entity_type: "contract",
      entity_id: contract.id,
      employee_id: contract.employee_id,
      triggered_at: new Date().toISOString(),
    });
  }

  if (!payload.length) {
    return { scannedContracts: contracts.length, upsertedAlerts: 0 };
  }

  const correlationIds = [...new Set(payload.map((item) => item.correlation_id))];
  const { data: existing, error: existingError } = await supabase
    .from("alerts")
    .select("correlation_id, status")
    .in("correlation_id", correlationIds)
    .in("status", ["active", "acknowledged"]);

  if (existingError) {
    console.error("generateContractExpiryAlerts load existing alerts error:", existingError);
    throw new Error(`Failed to check existing alerts: ${existingError.message}`);
  }

  const activeOrAcknowledged = new Set(
    (existing ?? []).map((row) => row.correlation_id).filter(Boolean)
  );
  const payloadToUpsert = payload.filter(
    (item) => !activeOrAcknowledged.has(item.correlation_id)
  );

  if (!payloadToUpsert.length) {
    return { scannedContracts: contracts.length, upsertedAlerts: 0 };
  }

  const { error: upsertError } = await supabase
    .from("alerts")
    .upsert(payloadToUpsert, { onConflict: "correlation_id" });

  if (upsertError) {
    console.error("generateContractExpiryAlerts upsert error:", upsertError);
    throw new Error(`Failed to upsert contract alerts: ${upsertError.message}`);
  }

  return {
    scannedContracts: contracts.length,
    upsertedAlerts: payloadToUpsert.length,
  };
}
