import { createClient } from "@/lib/supabase/server";

export const ALERT_RULE_MODULES = [
  "Contracts",
  "Documents",
  "Leave",
  "Physical Files",
  "General",
] as const;

export const ALERT_RULE_SEVERITIES = ["info", "warning", "critical"] as const;

export type AlertRuleRecord = {
  id: string;
  rule_name: string | null;
  module_name: string | null;
  rule_code: string | null;
  alert_type: string | null;
  entity_type: string | null;
  description: string | null;
  is_active: boolean | null;
  threshold_days: number | null;
  threshold_value: number | null;
  severity_level: string | null;
  repeat_interval_days: number | null;
  alert_time: string | null;
  applies_to_status: string | null;
  created_at: string | null;
  updated_at: string | null;
  is_persisted: boolean;
};

export type UpdateAlertRuleInput = {
  id: string;
  is_active: boolean;
  threshold_days: number | null;
  threshold_value: number | null;
  severity_level: string;
  repeat_interval_days: number | null;
  alert_time: string | null;
  applies_to_status: string | null;
};

type AlertRuleRow = Record<string, unknown>;

export const DEFAULT_ALERT_RULES: AlertRuleRecord[] = [
  {
    id: "contract_expiring",
    rule_name: "Contract Expiring Soon",
    module_name: "Contracts",
    rule_code: "contract_expiring",
    alert_type: "contract_expiring",
    entity_type: "contract",
    description: "Warn when active contracts are approaching their end date.",
    is_active: true,
    threshold_days: 30,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "active",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "contract_expiring_critical",
    rule_name: "Contract Critical Expiry",
    module_name: "Contracts",
    rule_code: "contract_expiring_critical",
    alert_type: "contract_expiring",
    entity_type: "contract",
    description: "Create critical alerts when contracts are within the critical expiry window.",
    is_active: true,
    threshold_days: 7,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "active",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "document_expiring",
    rule_name: "Document Expiring Soon",
    module_name: "Documents",
    rule_code: "document_expiring",
    alert_type: "document_expiring",
    entity_type: "document",
    description: "Warn when documents are approaching expiry.",
    is_active: true,
    threshold_days: 30,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: null,
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "low_sick_leave",
    rule_name: "Low Sick Leave",
    module_name: "Leave",
    rule_code: "low_sick_leave",
    alert_type: "low_leave_balance",
    entity_type: "leave_balance",
    description: "Warn when sick leave remaining days are at or below the configured threshold.",
    is_active: true,
    threshold_days: null,
    threshold_value: 3,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: null,
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "low_vacation_leave",
    rule_name: "Low Vacation Leave",
    module_name: "Leave",
    rule_code: "low_vacation_leave",
    alert_type: "low_leave_balance",
    entity_type: "leave_balance",
    description: "Warn when vacation leave remaining days are at or below the configured threshold.",
    is_active: true,
    threshold_days: null,
    threshold_value: 5,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: null,
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "leave_pending_approval",
    rule_name: "Pending Leave Approval",
    module_name: "Leave",
    rule_code: "leave_pending_approval",
    alert_type: "leave_pending_approval",
    entity_type: "leave_transaction",
    description: "Warn when leave approvals remain pending longer than the configured days.",
    is_active: true,
    threshold_days: 7,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "pending",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "file_overdue_return",
    rule_name: "Overdue Physical File Return",
    module_name: "Physical Files",
    rule_code: "file_overdue_return",
    alert_type: "file_overdue_return",
    entity_type: "file_movement",
    description: "Create critical alerts for overdue physical file returns when the schema supports expected_return_date.",
    is_active: true,
    threshold_days: 7,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "checked_out",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "contracts_expiring_in_30_days",
    rule_name: "Contracts Expiring in 30 Days",
    module_name: "Contracts",
    rule_code: "contracts_expiring_in_30_days",
    alert_type: "contract_expiring",
    entity_type: "contract",
    description: "Warn when active contracts expire within 30 days.",
    is_active: true,
    threshold_days: 30,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "active",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "contracts_expiring_in_90_days",
    rule_name: "Contracts Expiring in 90 Days",
    module_name: "Contracts",
    rule_code: "contracts_expiring_in_90_days",
    alert_type: "contract_expiring",
    entity_type: "contract",
    description: "Warn when active contracts expire within 90 days.",
    is_active: true,
    threshold_days: 90,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "active",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "documents_expiring_in_30_days",
    rule_name: "Documents Expiring in 30 Days",
    module_name: "Documents",
    rule_code: "documents_expiring_in_30_days",
    alert_type: "document_expiring",
    entity_type: "document",
    description: "Warn when documents expire within 30 days.",
    is_active: true,
    threshold_days: 30,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: null,
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "expired_documents",
    rule_name: "Expired Documents",
    module_name: "Documents",
    rule_code: "expired_documents",
    alert_type: "document_expired",
    entity_type: "document",
    description: "Create critical alerts for expired documents.",
    is_active: true,
    threshold_days: null,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: null,
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "expired_contracts",
    rule_name: "Expired Contracts",
    module_name: "Contracts",
    rule_code: "expired_contracts",
    alert_type: "contract_expired",
    entity_type: "contract",
    description: "Create critical alerts for expired contracts.",
    is_active: true,
    threshold_days: null,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "active",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "exhausted_sick_leave",
    rule_name: "Exhausted Sick Leave",
    module_name: "Leave",
    rule_code: "exhausted_sick_leave",
    alert_type: "exhausted_leave_balance",
    entity_type: "leave_balance",
    description: "Create critical alerts when sick leave is exhausted.",
    is_active: true,
    threshold_days: null,
    threshold_value: 0,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: null,
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "missing_medical_certificate",
    rule_name: "Missing Medical Certificate",
    module_name: "Leave",
    rule_code: "missing_medical_certificate",
    alert_type: "missing_medical_certificate",
    entity_type: "leave_transaction",
    description: "Warn when required medical certificates are missing.",
    is_active: true,
    threshold_days: 0,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "approved",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "files_in_transit_too_long",
    rule_name: "Files In Transit Too Long",
    module_name: "Physical Files",
    rule_code: "files_in_transit_too_long",
    alert_type: "files_in_transit_too_long",
    entity_type: "file_movement",
    description: "Warn when files remain in transit longer than configured.",
    is_active: true,
    threshold_days: 7,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "in_transit",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "missing_files",
    rule_name: "Missing Files",
    module_name: "Physical Files",
    rule_code: "missing_files",
    alert_type: "file_missing",
    entity_type: "file_movement",
    description: "Create critical alerts for files marked missing.",
    is_active: true,
    threshold_days: null,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "missing",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "gratuity_pending_review",
    rule_name: "Gratuity Pending Review",
    module_name: "General",
    rule_code: "gratuity_pending_review",
    alert_type: "gratuity_pending_review",
    entity_type: "gratuity_calculation",
    description: "Warn when gratuity calculations are pending review.",
    is_active: true,
    threshold_days: 0,
    threshold_value: null,
    severity_level: "warning",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "under_review",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "gratuity_approved_but_unpaid",
    rule_name: "Gratuity Approved But Unpaid",
    module_name: "General",
    rule_code: "gratuity_approved_but_unpaid",
    alert_type: "gratuity_approved_but_unpaid",
    entity_type: "gratuity_calculation",
    description: "Warn when gratuity is approved but not paid.",
    is_active: true,
    threshold_days: 0,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "approved",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "contract_expired",
    rule_name: "Contract Expired",
    module_name: "Contracts",
    rule_code: "contract_expired",
    alert_type: "contract_expired",
    entity_type: "contract",
    description: "Create critical alerts for contracts past their end date.",
    is_active: true,
    threshold_days: null,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "active",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "document_expired",
    rule_name: "Document Expired",
    module_name: "Documents",
    rule_code: "document_expired",
    alert_type: "document_expired",
    entity_type: "document",
    description: "Create critical alerts for documents past their expiry date.",
    is_active: true,
    threshold_days: null,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: null,
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
  {
    id: "file_missing",
    rule_name: "Missing Physical File",
    module_name: "Physical Files",
    rule_code: "file_missing",
    alert_type: "file_missing",
    entity_type: "file_movement",
    description: "Create critical alerts for physical files marked missing.",
    is_active: true,
    threshold_days: null,
    threshold_value: null,
    severity_level: "critical",
    repeat_interval_days: 1,
    alert_time: "06:00",
    applies_to_status: "missing",
    created_at: null,
    updated_at: null,
    is_persisted: false,
  },
];

export const ALERT_RULE_SQL_GUIDANCE = `
-- Optional alert_rules columns used by notification automation:
alter table public.alert_rules add column if not exists rule_code text;
alter table public.alert_rules add column if not exists alert_type text;
alter table public.alert_rules add column if not exists entity_type text;
alter table public.alert_rules add column if not exists description text;
alter table public.alert_rules add column if not exists threshold_days integer;
alter table public.alert_rules add column if not exists threshold_value numeric;
alter table public.alert_rules add column if not exists repeat_interval_days integer;
alter table public.alert_rules add column if not exists alert_time time;
alter table public.alert_rules add column if not exists applies_to_status text;
alter table public.alert_rules add column if not exists updated_at timestamptz;
`;

function stringValue(row: AlertRuleRow, key: string): string | null {
  const value = row[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(row: AlertRuleRow, key: string): number | null {
  const value = row[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function booleanValue(row: AlertRuleRow, key: string): boolean | null {
  const value = row[key];
  return typeof value === "boolean" ? value : null;
}

function mapAlertRule(row: AlertRuleRow): AlertRuleRecord {
  const id = stringValue(row, "id") ?? stringValue(row, "rule_code") ?? crypto.randomUUID();
  const ruleName = stringValue(row, "rule_name");
  const ruleCode = stringValue(row, "rule_code") ?? ruleName?.toLowerCase().replaceAll(" ", "_") ?? id;

  return {
    id,
    rule_name: ruleName,
    module_name: stringValue(row, "module_name"),
    rule_code: ruleCode,
    alert_type: stringValue(row, "alert_type"),
    entity_type: stringValue(row, "entity_type"),
    description: stringValue(row, "description") ?? stringValue(row, "condition_expression"),
    is_active: booleanValue(row, "is_active"),
    threshold_days: numberValue(row, "threshold_days"),
    threshold_value: numberValue(row, "threshold_value"),
    severity_level: stringValue(row, "severity_level"),
    repeat_interval_days: numberValue(row, "repeat_interval_days"),
    alert_time: stringValue(row, "alert_time"),
    applies_to_status: stringValue(row, "applies_to_status"),
    created_at: stringValue(row, "created_at"),
    updated_at: stringValue(row, "updated_at"),
    is_persisted: true,
  };
}

function mergeWithDefaults(rules: AlertRuleRecord[]): AlertRuleRecord[] {
  const byCode = new Map(rules.map((rule) => [rule.rule_code, rule]));
  const defaults = DEFAULT_ALERT_RULES.map((rule) => byCode.get(rule.rule_code) ?? rule);
  const extras = rules.filter((rule) => !DEFAULT_ALERT_RULES.some((item) => item.rule_code === rule.rule_code));
  return [...defaults, ...extras];
}

export async function listAlertRules(): Promise<AlertRuleRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alert_rules")
    .select("*")
    .order("module_name", { ascending: true })
    .order("rule_name", { ascending: true });

  if (error) {
    console.error("listAlertRules error:", error.message);
    return DEFAULT_ALERT_RULES;
  }

  return mergeWithDefaults(((data ?? []) as AlertRuleRow[]).map(mapAlertRule));
}

function nullableNumber(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableString(value: FormDataEntryValue | null): string | null {
  const text = String(value ?? "").trim();
  return text || null;
}

export function alertRuleInputFromFormData(formData: FormData): UpdateAlertRuleInput {
  return {
    id: String(formData.get("id") ?? "").trim(),
    is_active: formData.get("is_active") === "on",
    threshold_days: nullableNumber(formData.get("threshold_days")),
    threshold_value: nullableNumber(formData.get("threshold_value")),
    severity_level: String(formData.get("severity_level") ?? "warning").trim() || "warning",
    repeat_interval_days: nullableNumber(formData.get("repeat_interval_days")),
    alert_time: nullableString(formData.get("alert_time")),
    applies_to_status: nullableString(formData.get("applies_to_status")),
  };
}

function missingColumnName(message: string): string | null {
  const quoted = message.match(/'([^']+)' column/);
  if (quoted?.[1]) return quoted[1];
  const plain = message.match(/column "([^"]+)"/);
  return plain?.[1] ?? null;
}

export async function updateAlertRule(input: UpdateAlertRuleInput): Promise<void> {
  if (!input.id) throw new Error("Alert rule id is required.");

  const supabase = await createClient();
  const payload: Record<string, string | number | boolean | null> = {
    is_active: input.is_active,
    threshold_days: input.threshold_days,
    threshold_value: input.threshold_value,
    severity_level: input.severity_level,
    repeat_interval_days: input.repeat_interval_days,
    alert_time: input.alert_time,
    applies_to_status: input.applies_to_status,
    updated_at: new Date().toISOString(),
  };

  for (let attempt = 0; attempt < 8; attempt += 1) {
    const { error } = await supabase.from("alert_rules").update(payload).eq("id", input.id);
    if (!error) return;

    const column = missingColumnName(error.message);
    if (column && column in payload) {
      delete payload[column];
      continue;
    }

    throw new Error(`Failed to update alert rule: ${error.message}`);
  }

  throw new Error("Failed to update alert rule after removing unsupported columns.");
}
