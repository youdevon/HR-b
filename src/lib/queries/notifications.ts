import { listAlertRules, type AlertRuleRecord } from "@/lib/queries/alert-rules";
import { getEffectiveContractStatus } from "@/lib/queries/contracts";
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
  rule_code: string;
};

export type NotificationGenerationCounts = {
  Contracts: number;
  Documents: number;
  Leave: number;
  "Physical Files": number;
  Gratuity: number;
  General: number;
  byModule: Record<string, number>;
  byRule: Record<string, number>;
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

type EmployeeNameRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  file_number: string | null;
  file_status: string | null;
  file_location: string | null;
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
  effective_from: string | null;
  effective_to: string | null;
};

type LeaveTransactionRow = {
  id: string;
  employee_id: string | null;
  leave_type: string | null;
  status: string | null;
  medical_certificate_required?: boolean | null;
  medical_certificate_received?: boolean | null;
  start_date?: string | null;
  end_date?: string | null;
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

type CountableModule =
  | "Contracts"
  | "Documents"
  | "Leave"
  | "Physical Files"
  | "Gratuity";

const EMPTY_COUNTS: NotificationGenerationCounts = {
  Contracts: 0,
  Documents: 0,
  Leave: 0,
  "Physical Files": 0,
  Gratuity: 0,
  General: 0,
  byModule: {},
  byRule: {},
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

function formatEmployeeDisplay(employee: EmployeeNameRow | undefined): string {
  if (!employee) return "Unknown employee";
  const fullName = `${employee.first_name ?? ""} ${employee.last_name ?? ""}`.trim();
  return fullName || "Unknown employee";
}

function formatEmployeeFileNumber(employee: EmployeeNameRow | undefined): string {
  return employee?.file_number?.trim() || "—";
}

async function getEmployeeContextByIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  employeeIds: string[]
): Promise<Map<string, EmployeeNameRow>> {
  if (employeeIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from("employees")
    .select("id, first_name, last_name, file_number, file_status, file_location")
    .in("id", employeeIds);
  if (error) throw new Error(`Failed to load employee context for alerts: ${error.message}`);
  return new Map(((data ?? []) as EmployeeNameRow[]).map((row) => [row.id, row]));
}

function ruleDays(rule: AlertRuleRecord, fallback: number): number {
  const days = rule.threshold_days ?? Number(rule.threshold_value ?? fallback);
  return Number.isFinite(days) ? Number(days) : fallback;
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
  input: Omit<
    AlertPayload,
    "severity_level" | "status" | "triggered_at" | "correlation_id" | "rule_code"
  > & {
    correlationEntityId: string;
    fallbackSeverity: string;
    correlationPrefix?: string;
  }
): AlertPayload {
  const ruleCode = (rule.rule_code?.trim() || rule.alert_type?.trim() || "alert_rule").toLowerCase();
  const correlationPrefix = input.correlationPrefix?.trim().toLowerCase();

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
    correlation_id: correlationPrefix
      ? `${correlationPrefix}-${input.correlationEntityId}`
      : `${ruleCode}-${input.correlationEntityId}`,
    rule_code: ruleCode,
  };
}

async function insertNewAlerts(payload: AlertPayload[]): Promise<AlertPayload[]> {
  if (!payload.length) return [];

  const supabase = await createClient();
  const validPayload: AlertPayload[] = [];
  for (const alert of payload) {
    const correlationId = (alert.correlation_id ?? "").trim();
    if (!correlationId) {
      console.warn("Skipping generated alert without correlation_id:", {
        alert_title: alert.alert_title,
        module_name: alert.module_name,
        entity_type: alert.entity_type,
        entity_id: alert.entity_id,
      });
      continue;
    }
    validPayload.push({ ...alert, correlation_id: correlationId });
  }

  if (!validPayload.length) return [];

  const dedupedByCorrelation = new Map<string, AlertPayload>();
  for (const alert of validPayload) {
    if (!dedupedByCorrelation.has(alert.correlation_id)) {
      dedupedByCorrelation.set(alert.correlation_id, alert);
    }
  }
  const normalizedPayload = [...dedupedByCorrelation.values()];

  const correlationIds = [...new Set(normalizedPayload.map((alert) => alert.correlation_id))];
  const { data: existing, error: existingError } = await supabase
    .from("alerts")
    .select("correlation_id")
    .in("correlation_id", correlationIds)
    .in("status", ["active", "acknowledged", "resolved"]);

  if (existingError) {
    throw new Error(`Failed to check duplicate alerts: ${existingError.message}`);
  }

  const openCorrelationIds = new Set(
    (existing ?? [])
      .map((row) => row.correlation_id as string | null)
      .filter((value): value is string => Boolean(value))
  );
  const toUpsert = normalizedPayload.filter((alert) => !openCorrelationIds.has(alert.correlation_id));

  if (!toUpsert.length) return [];

  const upsertResult = await supabase
    .from("alerts")
    .upsert(toUpsert, { onConflict: "correlation_id" });
  const { error } = upsertResult;

  if (!error) {
    return toUpsert;
  }

  const upsertErrorMessage = String(error.message ?? "").toLowerCase();
  const missingConflictConstraint =
    upsertErrorMessage.includes("no unique or exclusion constraint") ||
    upsertErrorMessage.includes("on conflict specification");
  if (!missingConflictConstraint) {
    throw new Error(`Failed to upsert generated alerts: ${error.message}`);
  }

  // Fallback for environments where `alerts.correlation_id` unique constraint
  // has not been applied yet. We still prevent duplicates by pre-checking
  // existing active/acknowledged/resolved correlation IDs above.
  const { error: insertError } = await supabase.from("alerts").insert(toUpsert);
  if (insertError) {
    throw new Error(`Failed to insert generated alerts: ${insertError.message}`);
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

  const maxThreshold = Math.max(0, ...expiringRules.map((rule) => ruleDays(rule, 0)));
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select("id, employee_id, contract_number, contract_title, contract_status, end_date")
    .not("end_date", "is", null)
    .lte("end_date", dateInDays(maxThreshold))
    .order("end_date", { ascending: true });

  if (error) throw new Error(`Failed to load contracts for notifications: ${error.message}`);

  const today = todayDateString();
  const employeeIds = [
    ...new Set(
      ((data ?? []) as ContractRow[])
        .map((contract) => contract.employee_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];
  const employeeContextById = await getEmployeeContextByIds(supabase, employeeIds);

  function toLocalDate(dateText: string): Date {
    const [yearText, monthText, dayText] = dateText.split("-");
    return new Date(Number(yearText), Number(monthText) - 1, Number(dayText));
  }

  function dayDiff(fromDateText: string, toDateText: string): number {
    const from = toLocalDate(fromDateText);
    const to = toLocalDate(toDateText);
    return Math.floor((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  }

  const alerts: AlertPayload[] = [];

  for (const contract of (data ?? []) as ContractRow[]) {
    if (!contract.end_date) continue;
    const effectiveStatus = getEffectiveContractStatus({
      contract_status: contract.contract_status,
      end_date: contract.end_date,
    });
    const label = contract.contract_number ?? contract.contract_title ?? contract.id;
    const employee = contract.employee_id
      ? employeeContextById.get(contract.employee_id)
      : undefined;
    const employeeName = formatEmployeeDisplay(employee);
    const fileNumber = formatEmployeeFileNumber(employee);
    const daysUntilExpiry = dayDiff(today, contract.end_date);

    if (contract.end_date < today && effectiveStatus === "expired") {
      for (const rule of expiredRules) {
        if (!statusApplies(effectiveStatus, rule)) continue;
        const daysExpired = Math.abs(daysUntilExpiry);
        alerts.push(buildAlert(rule, {
          alert_title: rule.rule_name?.trim() || "Contract Expired",
          module_name: "Contracts",
          entity_type: "contract",
          entity_id: contract.id,
          employee_id: contract.employee_id,
          correlationEntityId: contract.id,
          alert_message: `${employeeName} (File #${fileNumber}) • Contract ${label} ended on ${contract.end_date} and is ${daysExpired} day(s) expired.`,
          correlationPrefix: "expired_contracts",
          fallbackSeverity: "critical",
        }));
      }
      continue;
    }

    for (const rule of expiringRules) {
      const threshold = ruleDays(rule, 0);
      const withinThreshold = contract.end_date >= today && contract.end_date <= dateInDays(threshold);
      if (effectiveStatus === "active" && withinThreshold && statusApplies(effectiveStatus, rule)) {
        alerts.push(buildAlert(rule, {
          alert_title: rule.rule_name?.trim() || "Contract Expiring Soon",
          alert_message: `${employeeName} (File #${fileNumber}) • Contract ${label} ends on ${contract.end_date} in ${Math.max(0, daysUntilExpiry)} day(s).`,
          module_name: "Contracts",
          entity_type: "contract",
          entity_id: contract.id,
          employee_id: contract.employee_id,
          correlationEntityId: contract.id,
          correlationPrefix: `contract_expiring-${(rule.rule_code ?? "contract_expiring").trim().toLowerCase()}`,
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
  hasStatusField: boolean;
  hasMedicalCertificateFields: boolean;
}> {
  const supabase = await createClient();
  const withStatusAndMedical = await supabase
    .from("leave_transactions")
    .select(
      "id, employee_id, leave_type, status, medical_certificate_required, medical_certificate_received, start_date, end_date, created_at"
    );

  if (!withStatusAndMedical.error) {
    return {
      rows: (withStatusAndMedical.data ?? []) as LeaveTransactionRow[],
      hasStatusField: true,
      hasMedicalCertificateFields: true,
    };
  }

  const firstErrorMessage = withStatusAndMedical.error.message.toLowerCase();
  const looksLikeSchemaColumnIssue =
    firstErrorMessage.includes("schema cache") ||
    firstErrorMessage.includes("column") ||
    firstErrorMessage.includes("medical_certificate") ||
    firstErrorMessage.includes("status");
  if (!looksLikeSchemaColumnIssue) {
    throw new Error(
      `Failed to load leave transactions for notifications: ${withStatusAndMedical.error.message}`
    );
  }

  const withStatusOnly = await supabase
    .from("leave_transactions")
    .select("id, employee_id, leave_type, status, start_date, end_date, created_at");

  if (!withStatusOnly.error) {
    return {
      rows: (withStatusOnly.data ?? []) as LeaveTransactionRow[],
      hasStatusField: true,
      hasMedicalCertificateFields: false,
    };
  }

  const secondErrorMessage = withStatusOnly.error.message.toLowerCase();
  const statusMissing =
    secondErrorMessage.includes("column") &&
    secondErrorMessage.includes("status");
  if (statusMissing) {
    // No status-like field available for rule evaluation; skip leave-transaction alerts safely.
    return {
      rows: [],
      hasStatusField: false,
      hasMedicalCertificateFields: false,
    };
  }

  const minimal = await supabase
    .from("leave_transactions")
    .select("id, employee_id, leave_type, created_at");

  if (minimal.error) {
    throw new Error(`Failed to load leave transactions for notifications: ${minimal.error.message}`);
  }

  return {
    rows: (minimal.data ?? []) as LeaveTransactionRow[],
    hasStatusField: false,
    hasMedicalCertificateFields: false,
  };
}

export async function generateLeaveAlertsFromRules(
  rules: AlertRuleRecord[]
): Promise<AlertPayload[]> {
  const sickRules = rulesFor(rules, ["low_sick_leave"]);
  const vacationRules = rulesFor(rules, ["low_vacation_leave"]);
  const vacationDueRules = rulesFor(rules, ["vacation_leave_due", "vacation_leave_due_before_period_end"]);
  const exhaustedSickRules = rulesFor(rules, ["exhausted_sick_leave", "sick_leave_exhausted"]);
  const pendingRules = rulesFor(rules, ["leave_pending_approval"], ["leave_pending_approval"]);
  const certificateRules = rulesFor(rules, ["missing_medical_certificate"], ["missing_medical_certificate"]);

  if (
    !sickRules.length &&
    !vacationRules.length &&
    !vacationDueRules.length &&
    !exhaustedSickRules.length &&
    !pendingRules.length &&
    !certificateRules.length
  ) {
    return [];
  }

  const supabase = await createClient();
  const alerts: AlertPayload[] = [];
  const today = todayDateString();

  const { data: currentlyOnLeaveRows, error: currentlyOnLeaveError } = await supabase
    .from("leave_transactions")
    .select("employee_id")
    .eq("status", "approved")
    .lte("start_date", today)
    .gte("end_date", today);
  if (currentlyOnLeaveError) {
    throw new Error(`Failed to evaluate employees currently on leave: ${currentlyOnLeaveError.message}`);
  }
  const currentlyOnLeaveEmployeeIds = new Set(
    (currentlyOnLeaveRows ?? [])
      .map((row) => row.employee_id as string | null)
      .filter((id): id is string => Boolean(id))
  );

  if (sickRules.length || vacationRules.length || vacationDueRules.length || exhaustedSickRules.length) {
    const { data, error } = await supabase
      .from("leave_balances")
      .select("id, employee_id, leave_type, remaining_days, effective_from, effective_to")
      .lte("effective_from", today)
      .gte("effective_to", today);

    if (error) throw new Error(`Failed to load leave balances for notifications: ${error.message}`);

    const balanceRows = (data ?? []) as LeaveBalanceRow[];
    const employeeIds = [
      ...new Set(
        balanceRows
          .map((balance) => balance.employee_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    const employeeContextById = await getEmployeeContextByIds(supabase, employeeIds);

    for (const balance of balanceRows) {
      const type = normalizedLeaveType(balance.leave_type);
      const remaining = Number(balance.remaining_days ?? 0);
      const employee = balance.employee_id ? employeeContextById.get(balance.employee_id) : undefined;
      const employeeName = formatEmployeeDisplay(employee);
      const fileNumber = formatEmployeeFileNumber(employee);
      if (type === "vacation_leave") {
        if (balance.employee_id && currentlyOnLeaveEmployeeIds.has(balance.employee_id)) {
          continue;
        }
        for (const rule of vacationRules) {
          const threshold = ruleValue(rule, 5);
          if (remaining <= threshold) {
            alerts.push(buildAlert(rule, {
              alert_title: "Low Vacation Leave Balance",
              alert_message: `${employeeName} (File #${fileNumber}) has ${remaining} vacation day(s) remaining. Effective period ends ${balance.effective_to ?? "—"}.`,
              module_name: "Leave",
              entity_type: "leave_balance",
              entity_id: balance.id,
              employee_id: balance.employee_id,
              correlationEntityId: balance.id,
              correlationPrefix: "low_vacation_leave",
              fallbackSeverity: "warning",
            }));
          }
        }
        for (const rule of vacationDueRules) {
          if (!balance.effective_to || remaining <= 0) continue;
          const threshold = ruleDays(rule, 30);
          if (balance.effective_to >= todayDateString() && balance.effective_to <= dateInDays(threshold)) {
            alerts.push(buildAlert(rule, {
              alert_title: "Vacation Leave Due",
              alert_message: `Employee has ${remaining} vacation day(s) remaining before period end ${balance.effective_to}. Schedule usage before entitlement window closes.`,
              module_name: "Leave",
              entity_type: "leave_balance",
              entity_id: balance.id,
              employee_id: balance.employee_id,
              correlationEntityId: balance.id,
              correlationPrefix: "vacation_leave_due",
              fallbackSeverity: "warning",
            }));
          }
        }
      }

      if (type === "sick_leave") {
        for (const rule of sickRules) {
          const threshold = ruleValue(rule, 5);
          if (remaining <= threshold) {
            alerts.push(buildAlert(rule, {
              alert_title: "Low Sick Leave Balance",
              alert_message: `${employeeName} (File #${fileNumber}) has ${remaining} sick day(s) remaining. Effective period ends ${balance.effective_to ?? "—"}.`,
              module_name: "Leave",
              entity_type: "leave_balance",
              entity_id: balance.id,
              employee_id: balance.employee_id,
              correlationEntityId: balance.id,
              correlationPrefix: "low_sick_leave",
              fallbackSeverity: remaining <= 1 ? "critical" : "warning",
            }));
          }
        }
        for (const rule of exhaustedSickRules) {
          const threshold = ruleValue(rule, 0);
          if (remaining <= threshold) {
            alerts.push(buildAlert(rule, {
              alert_title: "Sick Leave Nearly Finished",
              alert_message:
                remaining <= 0
                  ? "Sick leave is exhausted (0 days remaining)."
                  : `Sick leave is nearly finished with ${remaining} day(s) remaining.`,
              module_name: "Leave",
              entity_type: "leave_balance",
              entity_id: balance.id,
              employee_id: balance.employee_id,
              correlationEntityId: balance.id,
              correlationPrefix: "sick_leave_exhausted",
              fallbackSeverity: remaining <= 0 ? "critical" : "warning",
            }));
          }
        }
      }
    }
  }

  if (pendingRules.length || certificateRules.length) {
    const { rows, hasStatusField, hasMedicalCertificateFields } =
      await loadLeaveTransactionsForAlerts();

    for (const transaction of rows) {
      const currentStatus = transaction.status;

      if (hasStatusField && normalized(currentStatus) === "pending") {
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
              correlationPrefix: "leave_pending_approval",
              fallbackSeverity: "warning",
            }));
          }
        }
      }

      if (
        hasStatusField &&
        hasMedicalCertificateFields &&
        transaction.medical_certificate_required === true
      ) {
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
  const supabase = await createClient();
  const movementEmployeeIds = [
    ...new Set(rows.map((row) => row.employee_id).filter((id): id is string => Boolean(id))),
  ];
  const employeeContextById = await getEmployeeContextByIds(supabase, movementEmployeeIds);

  for (const movement of rows) {
    const label = movement.file_number ?? movement.id;
    const status = normalized(movement.movement_status);
    const employee = movement.employee_id ? employeeContextById.get(movement.employee_id) : undefined;
    const employeeName = formatEmployeeDisplay(employee);
    const fileNumber = movement.file_number ?? formatEmployeeFileNumber(employee);

    if (status === "missing") {
      for (const rule of missingRules) {
        alerts.push(buildAlert(rule, {
          alert_title: "Missing Physical File",
          alert_message: `${employeeName} (File #${fileNumber}) physical file is marked missing.${employee?.file_location ? ` Last known location: ${employee.file_location}.` : ""}`,
          module_name: "Physical Files",
          entity_type: "file_movement",
          entity_id: movement.id,
          employee_id: movement.employee_id,
          correlationEntityId: movement.employee_id ?? movement.id,
          correlationPrefix: "missing_file",
          fallbackSeverity: "critical",
        }));
      }
    }

    if (hasExpectedReturnDate && status === "checked_out") {
      for (const rule of overdueRules) {
        if (!movement.expected_return_date || movement.expected_return_date >= today) continue;
        alerts.push(buildAlert(rule, {
          alert_title: "Overdue Physical File Return",
          alert_message: `${employeeName} (File #${fileNumber}) file moved/checked out on ${movement.date_sent ?? "—"} and expected return was ${movement.expected_return_date}.`,
          module_name: "Physical Files",
          entity_type: "file_movement",
          entity_id: movement.id,
          employee_id: movement.employee_id,
          correlationEntityId: movement.id,
          correlationPrefix: "overdue_file_return",
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
            alert_message: `${employeeName} (File #${fileNumber}) file has been in transit since ${movement.date_sent ?? "—"} for more than ${threshold} days.${movement.expected_return_date ? ` Expected return: ${movement.expected_return_date}.` : ""}`,
            module_name: "Physical Files",
            entity_type: "file_movement",
            entity_id: movement.id,
            employee_id: movement.employee_id,
            correlationEntityId: movement.id,
            correlationPrefix: "files_in_transit_too_long",
            fallbackSeverity: "warning",
          }));
        }
      }
    }

  const { data: employeeRows, error: employeeRowsError } = await supabase
    .from("employees")
    .select("id, first_name, last_name, file_number, file_status, file_location")
    .eq("file_status", "missing");
  if (employeeRowsError) {
    throw new Error(`Failed to load employees with missing files: ${employeeRowsError.message}`);
  }
  for (const employee of (employeeRows ?? []) as EmployeeNameRow[]) {
    const employeeName = formatEmployeeDisplay(employee);
    const fileNumber = formatEmployeeFileNumber(employee);
    for (const rule of missingRules) {
      alerts.push(buildAlert(rule, {
        alert_title: "Missing Physical File",
        alert_message: `${employeeName} (File #${fileNumber}) physical file is marked missing.${employee.file_location ? ` Last known location: ${employee.file_location}.` : ""}`,
        module_name: "Physical Files",
        entity_type: "employee",
        entity_id: employee.id,
        employee_id: employee.id,
        correlationEntityId: employee.id,
        correlationPrefix: "missing_file",
        fallbackSeverity: "critical",
      }));
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

function countsForInserted(
  inserted: AlertPayload[],
  sourceRules: AlertRuleRecord[]
): NotificationGenerationCounts {
  const counts = { ...EMPTY_COUNTS };
  const typedModules = new Set<CountableModule>([
    "Contracts",
    "Documents",
    "Leave",
    "Physical Files",
    "Gratuity",
  ]);
  for (const rule of sourceRules) {
    const ruleCode = (rule.rule_code ?? "").trim().toLowerCase();
    if (ruleCode) {
      counts.byRule[ruleCode] = counts.byRule[ruleCode] ?? 0;
    }
  }

  for (const alert of inserted) {
    const module = alert.module_name as CountableModule;
    if (typedModules.has(module)) {
      counts[module] += 1;
    } else {
      counts.General += 1;
    }
    const moduleLabel = alert.module_name?.trim() || "General";
    counts.byModule[moduleLabel] = (counts.byModule[moduleLabel] ?? 0) + 1;
    const ruleCode = alert.rule_code?.trim() || "unknown_rule";
    counts.byRule[ruleCode] = (counts.byRule[ruleCode] ?? 0) + 1;
    counts.total += 1;
  }

  return counts;
}

export async function generateAllSystemAlerts(): Promise<NotificationGenerationCounts> {
  const rules = (await listAlertRules()).filter((rule) => {
    if (rule.is_active === false) return false;
    const moduleName = (rule.module_name ?? "").trim().toLowerCase();
    return moduleName !== "documents" && moduleName !== "compensation" && moduleName !== "records";
  });
  const alertGroups = await Promise.all([
    generateContractAlertsFromRules(rules),
    generateLeaveAlertsFromRules(rules),
    generatePhysicalFileAlertsFromRules(rules),
    generateGratuityAlertsFromRules(rules),
  ]);
  const inserted = await insertNewAlerts(alertGroups.flat());
  return countsForInserted(inserted, rules);
}
