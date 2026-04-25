import { listAlertRules, type AlertRuleRecord } from "@/lib/queries/alert-rules";
import { createClient } from "@/lib/supabase/server";

type AlertPayload = {
  alert_title: string;
  alert_message: string;
  module_name: string;
  entity_type: string;
  entity_id: string;
  employee_id: string | null;
  severity_level: string;
  status: "active";
  triggered_at: string;
  correlation_id: string;
};

export type NotificationGenerationCounts = {
  Contracts: number;
  Documents: number;
  Leave: number;
  "Physical Files": number;
  Gratuity: number;
  General: number;
  total: number;
};

type ContractRow = {
  id: string;
  employee_id: string | null;
  contract_number: string | null;
  contract_title: string | null;
  contract_status: string | null;
  end_date: string | null;
};

type DocumentRow = {
  id: string;
  employee_id: string | null;
  document_title: string | null;
  document_status: string | null;
  expiry_date: string | null;
};

type LeaveBalanceRow = {
  id: string;
  employee_id: string | null;
  leave_type: string | null;
  remaining_days: number | null;
};

type LeaveTransactionRow = {
  id: string;
  employee_id: string | null;
  leave_type: string | null;
  approval_status: string | null;
  status: string | null;
  medical_certificate_required?: boolean | null;
  medical_certificate_received?: boolean | null;
  created_at: string | null;
};

type FileMovementRow = {
  id: string;
  employee_id: string | null;
  file_number: string | null;
  movement_status: string | null;
  date_sent: string | null;
  expected_return_date?: string | null;
};

type GratuityCalculationRow = {
  id: string;
  employee_id: string | null;
  calculation_status: string | null;
  approved_amount: number | null;
  approved_at: string | null;
  created_at: string | null;
};

const EMPTY_COUNTS: NotificationGenerationCounts = {
  Contracts: 0,
  Documents: 0,
  Leave: 0,
  "Physical Files": 0,
  Gratuity: 0,
  General: 0,
  total: 0,
};

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateInDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function normalized(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function normalizedLeaveType(value: string | null): string {
  return normalized(value).replaceAll(" ", "_");
}

function ruleDays(rule: AlertRuleRecord, fallback: number): number {
  if (typeof rule.threshold_days === "number") return rule.threshold_days;
  if (typeof rule.threshold_value === "number") return rule.threshold_value;
  return fallback;
}

function ruleValue(rule: AlertRuleRecord, fallback: number): number {
  if (typeof rule.threshold_value === "number") return rule.threshold_value;
  if (typeof rule.threshold_days === "number") return rule.threshold_days;
  return fallback;
}

function ruleMatches(rule: AlertRuleRecord, codes: string[], alertTypes: string[] = []): boolean {
  const code = normalized(rule.rule_code);
  const alertType = normalized(rule.alert_type);
  return (
    rule.is_active !== false &&
    (codes.includes(code) || (alertType ? alertTypes.includes(alertType) : false))
  );
}

function rulesFor(
  rules: AlertRuleRecord[],
  codes: string[],
  alertTypes: string[] = []
): AlertRuleRecord[] {
  return rules.filter((rule) => ruleMatches(rule, codes, alertTypes));
}

function statusApplies(actual: string | null, rule: AlertRuleRecord): boolean {
  const expected = normalized(rule.applies_to_status);
  if (!expected) return true;
  return normalized(actual) === expected;
}

function severity(rule: AlertRuleRecord, fallback: string): string {
  return rule.severity_level?.trim() || fallback;
}

function entityType(rule: AlertRuleRecord, fallback: string): string {
  return rule.entity_type?.trim() || fallback;
}

function moduleName(rule: AlertRuleRecord, fallback: string): string {
  return rule.module_name?.trim() || fallback;
}

function buildAlert(
  rule: AlertRuleRecord,
  input: Omit<AlertPayload, "severity_level" | "status" | "triggered_at" | "correlation_id"> & {
    correlationEntityId: string;
    fallbackSeverity: string;
  }
): AlertPayload {
  const ruleCode = rule.rule_code?.trim() || rule.alert_type?.trim() || "alert_rule";

  return {
    alert_title: input.alert_title,
    alert_message: input.alert_message,
    module_name: moduleName(rule, input.module_name),
    entity_type: entityType(rule, input.entity_type),
    entity_id: input.entity_id,
    employee_id: input.employee_id,
    severity_level: severity(rule, input.fallbackSeverity),
    status: "active",
    triggered_at: new Date().toISOString(),
    correlation_id: `${ruleCode}-${input.correlationEntityId}`,
  };
}

async function insertNewAlerts(payload: AlertPayload[]): Promise<AlertPayload[]> {
  if (!payload.length) return [];

  const supabase = await createClient();
  const correlationIds = [...new Set(payload.map((alert) => alert.correlation_id))];
  const { data: existing, error: existingError } = await supabase
    .from("alerts")
    .select("correlation_id")
    .in("correlation_id", correlationIds)
    .in("status", ["active", "acknowledged"]);

  if (existingError) {
    throw new Error(`Failed to check duplicate alerts: ${existingError.message}`);
  }

  const openCorrelationIds = new Set(
    (existing ?? [])
      .map((row) => row.correlation_id as string | null)
      .filter((value): value is string => Boolean(value))
  );
  const toUpsert = payload.filter((alert) => !openCorrelationIds.has(alert.correlation_id));

  if (!toUpsert.length) return [];

  const { error } = await supabase
    .from("alerts")
    .upsert(toUpsert, { onConflict: "correlation_id" });

  if (error) {
    throw new Error(`Failed to upsert generated alerts: ${error.message}`);
  }

  return toUpsert;
}

export async function generateContractAlertsFromRules(
  rules: AlertRuleRecord[]
): Promise<AlertPayload[]> {
  const expiringRules = rulesFor(
    rules,
    [
      "contract_expiring",
      "contract_expiring_critical",
      "contracts_expiring_in_30_days",
      "contracts_expiring_in_90_days",
    ],
    ["contract_expiring"]
  );
  const expiredRules = rulesFor(
    rules,
    ["contract_expired", "expired_contracts"],
    ["contract_expired"]
  );

  if (!expiringRules.length && !expiredRules.length) return [];

  const maxThreshold = Math.max(0, ...expiringRules.map((rule) => ruleDays(rule, 30)));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, employee_id, contract_number, contract_title, contract_status, end_date")
    .not("end_date", "is", null)
    .lte("end_date", dateInDays(maxThreshold));

  if (error) throw new Error(`Failed to load contracts for notifications: ${error.message}`);

  const today = todayDateString();
  const alerts: AlertPayload[] = [];

  for (const contract of (data ?? []) as ContractRow[]) {
    if (!contract.end_date) continue;
    const label = contract.contract_number ?? contract.contract_title ?? contract.id;

    if (contract.end_date < today) {
      for (const rule of expiredRules) {
        if (!statusApplies(contract.contract_status, rule)) continue;
        alerts.push(buildAlert(rule, {
          alert_title: "Contract Expired",
          alert_message: `Contract ${label} expired on ${contract.end_date}.`,
          module_name: "Contracts",
          entity_type: "contract",
          entity_id: contract.id,
          employee_id: contract.employee_id,
          correlationEntityId: contract.id,
          fallbackSeverity: "critical",
        }));
      }
      continue;
    }

    for (const rule of expiringRules) {
      const threshold = ruleDays(rule, 30);
      if (contract.end_date <= dateInDays(threshold) && statusApplies(contract.contract_status, rule)) {
        alerts.push(buildAlert(rule, {
          alert_title: threshold <= 7 ? "Contract Critical Expiry" : "Contract Expiring Soon",
          alert_message: `Contract ${label} ends on ${contract.end_date}.`,
          module_name: "Contracts",
          entity_type: "contract",
          entity_id: contract.id,
          employee_id: contract.employee_id,
          correlationEntityId: contract.id,
          fallbackSeverity: threshold <= 7 ? "critical" : "warning",
        }));
      }
    }
  }

  return alerts;
}

export async function generateDocumentAlertsFromRules(
  rules: AlertRuleRecord[]
): Promise<AlertPayload[]> {
  const expiringRules = rulesFor(
    rules,
    ["document_expiring", "documents_expiring_in_30_days"],
    ["document_expiring"]
  );
  const expiredRules = rulesFor(
    rules,
    ["document_expired", "expired_documents"],
    ["document_expired"]
  );

  if (!expiringRules.length && !expiredRules.length) return [];

  const maxThreshold = Math.max(0, ...expiringRules.map((rule) => ruleDays(rule, 30)));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, employee_id, document_title, document_status, expiry_date")
    .not("expiry_date", "is", null)
    .lte("expiry_date", dateInDays(maxThreshold));

  if (error) throw new Error(`Failed to load documents for notifications: ${error.message}`);

  const today = todayDateString();
  const alerts: AlertPayload[] = [];

  for (const document of (data ?? []) as DocumentRow[]) {
    if (!document.expiry_date) continue;
    const label = document.document_title ?? document.id;

    if (document.expiry_date < today) {
      for (const rule of expiredRules) {
        if (!statusApplies(document.document_status, rule)) continue;
        alerts.push(buildAlert(rule, {
          alert_title: "Document Expired",
          alert_message: `Document ${label} expired on ${document.expiry_date}.`,
          module_name: "Documents",
          entity_type: "document",
          entity_id: document.id,
          employee_id: document.employee_id,
          correlationEntityId: document.id,
          fallbackSeverity: "critical",
        }));
      }
      continue;
    }

    for (const rule of expiringRules) {
      const threshold = ruleDays(rule, 30);
      if (document.expiry_date <= dateInDays(threshold) && statusApplies(document.document_status, rule)) {
        alerts.push(buildAlert(rule, {
          alert_title: "Document Expiring Soon",
          alert_message: `Document ${label} expires on ${document.expiry_date}.`,
          module_name: "Documents",
          entity_type: "document",
          entity_id: document.id,
          employee_id: document.employee_id,
          correlationEntityId: document.id,
          fallbackSeverity: "warning",
        }));
      }
    }
  }

  return alerts;
}

async function loadLeaveTransactionsForAlerts(): Promise<{
  rows: LeaveTransactionRow[];
  hasMedicalCertificateFields: boolean;
}> {
  const supabase = await createClient();
  const withMedical = await supabase
    .from("leave_transactions")
    .select(
      "id, employee_id, leave_type, approval_status, status, medical_certificate_required, medical_certificate_received, created_at"
    );

  if (!withMedical.error) {
    return {
      rows: (withMedical.data ?? []) as LeaveTransactionRow[],
      hasMedicalCertificateFields: true,
    };
  }

  const message = withMedical.error.message.toLowerCase();
  if (!message.includes("medical_certificate") && !message.includes("schema cache")) {
    throw new Error(`Failed to load leave transactions for notifications: ${withMedical.error.message}`);
  }

  const fallback = await supabase
    .from("leave_transactions")
    .select("id, employee_id, leave_type, approval_status, status, created_at");

  if (fallback.error) {
    throw new Error(`Failed to load leave transactions for notifications: ${fallback.error.message}`);
  }

  return {
    rows: (fallback.data ?? []) as LeaveTransactionRow[],
    hasMedicalCertificateFields: false,
  };
}

export async function generateLeaveAlertsFromRules(
  rules: AlertRuleRecord[]
): Promise<AlertPayload[]> {
  const sickRules = rulesFor(rules, ["low_sick_leave"]);
  const vacationRules = rulesFor(rules, ["low_vacation_leave"]);
  const exhaustedSickRules = rulesFor(rules, ["exhausted_sick_leave"]);
  const pendingRules = rulesFor(rules, ["leave_pending_approval"], ["leave_pending_approval"]);
  const certificateRules = rulesFor(rules, ["missing_medical_certificate"], ["missing_medical_certificate"]);

  if (
    !sickRules.length &&
    !vacationRules.length &&
    !exhaustedSickRules.length &&
    !pendingRules.length &&
    !certificateRules.length
  ) {
    return [];
  }

  const supabase = await createClient();
  const alerts: AlertPayload[] = [];

  if (sickRules.length || vacationRules.length || exhaustedSickRules.length) {
    const { data, error } = await supabase
      .from("leave_balances")
      .select("id, employee_id, leave_type, remaining_days");

    if (error) throw new Error(`Failed to load leave balances for notifications: ${error.message}`);

    for (const balance of (data ?? []) as LeaveBalanceRow[]) {
      const type = normalizedLeaveType(balance.leave_type);
      const remaining = Number(balance.remaining_days ?? 0);
      const matchingRules =
        type === "sick_leave"
          ? [...sickRules, ...exhaustedSickRules]
          : type === "vacation_leave"
            ? vacationRules
            : [];

      for (const rule of matchingRules) {
        const threshold = ruleValue(rule, normalized(rule.rule_code) === "exhausted_sick_leave" ? 0 : 3);
        if (remaining <= threshold) {
          alerts.push(buildAlert(rule, {
            alert_title:
              normalized(rule.rule_code) === "exhausted_sick_leave"
                ? "Exhausted Sick Leave"
                : type === "sick_leave"
                  ? "Low Sick Leave"
                  : "Low Vacation Leave",
            alert_message: `${type.replaceAll("_", " ")} balance is ${remaining} days, at or below threshold ${threshold}.`,
            module_name: "Leave",
            entity_type: "leave_balance",
            entity_id: balance.id,
            employee_id: balance.employee_id,
            correlationEntityId: balance.id,
            fallbackSeverity: normalized(rule.rule_code) === "exhausted_sick_leave" ? "critical" : "warning",
          }));
        }
      }
    }
  }

  if (pendingRules.length || certificateRules.length) {
    const { rows, hasMedicalCertificateFields } = await loadLeaveTransactionsForAlerts();

    for (const transaction of rows) {
      const currentStatus = transaction.approval_status ?? transaction.status;

      if (normalized(currentStatus) === "pending") {
        for (const rule of pendingRules) {
          const threshold = ruleDays(rule, 7);
          if (transaction.created_at && transaction.created_at <= `${dateDaysAgo(threshold)}T23:59:59`) {
            alerts.push(buildAlert(rule, {
              alert_title: "Pending Leave Approval",
              alert_message: `Leave request has been pending for more than ${threshold} days.`,
              module_name: "Leave",
              entity_type: "leave_transaction",
              entity_id: transaction.id,
              employee_id: transaction.employee_id,
              correlationEntityId: transaction.id,
              fallbackSeverity: "warning",
            }));
          }
        }
      }

      if (hasMedicalCertificateFields && transaction.medical_certificate_required === true) {
        const received = transaction.medical_certificate_received === true;
        if (!received) {
          for (const rule of certificateRules) {
            if (!statusApplies(currentStatus, rule)) continue;
            alerts.push(buildAlert(rule, {
              alert_title: "Missing Medical Certificate",
              alert_message: "A leave transaction requires a medical certificate that has not been received.",
              module_name: "Leave",
              entity_type: "leave_transaction",
              entity_id: transaction.id,
              employee_id: transaction.employee_id,
              correlationEntityId: transaction.id,
              fallbackSeverity: "warning",
            }));
          }
        }
      }
    }
  }

  return alerts;
}

async function loadFileMovementsForAlerts(): Promise<{
  rows: FileMovementRow[];
  hasExpectedReturnDate: boolean;
}> {
  const supabase = await createClient();
  const withExpectedReturn = await supabase
    .from("file_movements")
    .select("id, employee_id, file_number, movement_status, date_sent, expected_return_date")
    .in("movement_status", ["checked_out", "missing", "in_transit", "transferred"]);

  if (!withExpectedReturn.error) {
    return {
      rows: (withExpectedReturn.data ?? []) as FileMovementRow[],
      hasExpectedReturnDate: true,
    };
  }

  const message = withExpectedReturn.error.message.toLowerCase();
  if (!message.includes("expected_return_date") && !message.includes("schema cache")) {
    throw new Error(`Failed to load physical files for notifications: ${withExpectedReturn.error.message}`);
  }

  const fallback = await supabase
    .from("file_movements")
    .select("id, employee_id, file_number, movement_status, date_sent")
    .in("movement_status", ["checked_out", "missing", "in_transit", "transferred"]);

  if (fallback.error) {
    throw new Error(`Failed to load physical files for notifications: ${fallback.error.message}`);
  }

  return {
    rows: (fallback.data ?? []) as FileMovementRow[],
    hasExpectedReturnDate: false,
  };
}

export async function generatePhysicalFileAlertsFromRules(
  rules: AlertRuleRecord[]
): Promise<AlertPayload[]> {
  const overdueRules = rulesFor(rules, ["file_overdue_return"], ["file_overdue_return"]);
  const inTransitRules = rulesFor(rules, ["files_in_transit_too_long"], ["files_in_transit_too_long"]);
  const missingRules = rulesFor(rules, ["missing_files", "file_missing"], ["file_missing"]);

  if (!overdueRules.length && !inTransitRules.length && !missingRules.length) return [];

  const { rows, hasExpectedReturnDate } = await loadFileMovementsForAlerts();
  const today = todayDateString();
  const alerts: AlertPayload[] = [];

  for (const movement of rows) {
    const label = movement.file_number ?? movement.id;
    const status = normalized(movement.movement_status);

    if (status === "missing") {
      for (const rule of missingRules) {
        alerts.push(buildAlert(rule, {
          alert_title: "Missing Physical File",
          alert_message: `Physical file ${label} is marked missing.`,
          module_name: "Physical Files",
          entity_type: "file_movement",
          entity_id: movement.id,
          employee_id: movement.employee_id,
          correlationEntityId: movement.id,
          fallbackSeverity: "critical",
        }));
      }
    }

    if (hasExpectedReturnDate && status === "checked_out") {
      for (const rule of overdueRules) {
        if (!movement.expected_return_date || movement.expected_return_date >= today) continue;
        alerts.push(buildAlert(rule, {
          alert_title: "Overdue Physical File Return",
          alert_message: `Physical file ${label} was expected back on ${movement.expected_return_date}.`,
          module_name: "Physical Files",
          entity_type: "file_movement",
          entity_id: movement.id,
          employee_id: movement.employee_id,
          correlationEntityId: movement.id,
          fallbackSeverity: "critical",
        }));
      }
    }

    if (status === "in_transit" || status === "transferred") {
      for (const rule of inTransitRules) {
        const threshold = ruleDays(rule, 7);
        if (movement.date_sent && movement.date_sent <= dateDaysAgo(threshold)) {
          alerts.push(buildAlert(rule, {
            alert_title: "Physical File In Transit Too Long",
            alert_message: `Physical file ${label} has been in transit for more than ${threshold} days.`,
            module_name: "Physical Files",
            entity_type: "file_movement",
            entity_id: movement.id,
            employee_id: movement.employee_id,
            correlationEntityId: movement.id,
            fallbackSeverity: "warning",
          }));
        }
      }
    }
  }

  return alerts;
}

export async function generateGratuityAlertsFromRules(
  rules: AlertRuleRecord[]
): Promise<AlertPayload[]> {
  const pendingRules = rulesFor(rules, ["gratuity_pending_review"], ["gratuity_pending_review"]);
  const unpaidRules = rulesFor(rules, ["gratuity_approved_but_unpaid"], ["gratuity_approved_but_unpaid"]);

  if (!pendingRules.length && !unpaidRules.length) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gratuity_calculations")
    .select("id, employee_id, calculation_status, approved_amount, approved_at, created_at")
    .in("calculation_status", ["calculated", "under_review", "approved", "overridden"]);

  if (error) throw new Error(`Failed to load gratuity calculations for notifications: ${error.message}`);

  const alerts: AlertPayload[] = [];

  for (const calculation of (data ?? []) as GratuityCalculationRow[]) {
    const status = normalized(calculation.calculation_status);

    if (status === "calculated" || status === "under_review") {
      for (const rule of pendingRules) {
        if (!statusApplies(calculation.calculation_status, rule)) continue;
        const threshold = ruleDays(rule, 0);
        if (calculation.created_at && calculation.created_at > `${dateDaysAgo(threshold)}T23:59:59`) continue;
        alerts.push(buildAlert(rule, {
          alert_title: "Gratuity Pending Review",
          alert_message: "A gratuity calculation is pending review.",
          module_name: "Gratuity",
          entity_type: "gratuity_calculation",
          entity_id: calculation.id,
          employee_id: calculation.employee_id,
          correlationEntityId: calculation.id,
          fallbackSeverity: "warning",
        }));
      }
    }

    if ((status === "approved" || status === "overridden") && calculation.approved_amount !== null) {
      for (const rule of unpaidRules) {
        if (!statusApplies(calculation.calculation_status, rule)) continue;
        const threshold = ruleDays(rule, 0);
        const basisDate = calculation.approved_at ?? calculation.created_at;
        if (basisDate && basisDate > `${dateDaysAgo(threshold)}T23:59:59`) continue;
        alerts.push(buildAlert(rule, {
          alert_title: "Gratuity Approved But Unpaid",
          alert_message: "A gratuity calculation has been approved but still requires payment follow-up.",
          module_name: "Gratuity",
          entity_type: "gratuity_calculation",
          entity_id: calculation.id,
          employee_id: calculation.employee_id,
          correlationEntityId: calculation.id,
          fallbackSeverity: "critical",
        }));
      }
    }
  }

  return alerts;
}

function countsForInserted(inserted: AlertPayload[]): NotificationGenerationCounts {
  const counts = { ...EMPTY_COUNTS };

  for (const alert of inserted) {
    const module = alert.module_name as keyof NotificationGenerationCounts;
    if (module in counts && module !== "total") {
      counts[module] += 1;
    } else {
      counts.General += 1;
    }
    counts.total += 1;
  }

  return counts;
}

export async function generateAllSystemAlerts(): Promise<NotificationGenerationCounts> {
  const rules = (await listAlertRules()).filter((rule) => rule.is_active !== false);
  const alertGroups = await Promise.all([
    generateContractAlertsFromRules(rules),
    generateDocumentAlertsFromRules(rules),
    generateLeaveAlertsFromRules(rules),
    generatePhysicalFileAlertsFromRules(rules),
    generateGratuityAlertsFromRules(rules),
  ]);
  const inserted = await insertNewAlerts(alertGroups.flat());
  return countsForInserted(inserted);
}
