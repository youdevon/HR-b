import { createClient } from "@/lib/supabase/server";
import { getContractById } from "@/lib/queries/contracts";

export const GRATUITY_RATE = 0.2;
export const GOVERNMENT_TAX_RATE = 0.25;
export const NET_GRATUITY_RATE = 0.75;
export const DEFAULT_GRATUITY_RATE_PERCENT = 20;
export const DEFAULT_GOVERNMENT_TAX_PERCENT = 25;
const GRATUITY_RATE_RULE_CODE = "global_gratuity_rate_percent";
const GOVERNMENT_TAX_RULE_CODE = "global_government_tax_percent";

export type GratuityRuleRecord = {
  id: string;
  rule_name: string | null;
  rule_code: string | null;
  description: string | null;
  contract_type: string | null;
  employment_type: string | null;
  calculation_basis: string | null;
  multiplier_value: number | null;
  percentage_value: number | null;
  minimum_service_months: number | null;
  include_allowances: boolean | null;
  rounding_rule: string | null;
  effective_from: string | null;
  effective_to: string | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type GratuityCalculationRecord = {
  id: string;
  employee_id: string | null;
  contract_id: string | null;
  gratuity_rule_id: string | null;
  calculation_date: string | null;
  service_start_date: string | null;
  service_end_date: string | null;
  service_length_days: number | null;
  service_length_months: number | null;
  service_length_years: number | null;
  salary_basis_amount: number | null;
  allowance_basis_amount: number | null;
  total_basis_amount: number | null;
  calculated_amount: number | null;
  reviewed_amount: number | null;
  approved_amount: number | null;
  calculation_status: string | null;
  calculation_notes: string | null;
  override_reason: string | null;
  approved_at: string | null;
  created_at: string | null;
};

export type GratuityPaymentRecord = {
  id: string;
  employee_id: string | null;
  contract_id: string | null;
  gratuity_calculation_id: string | null;
  payment_date: string | null;
  payment_amount: number | null;
  payment_status: string | null;
  payment_reference: string | null;
  payment_notes: string | null;
  created_at: string | null;
};

export type GratuityPaymentBreakdown = {
  is_eligible: boolean;
  ineligible_reason: string | null;
  gratuity_rate_percent: number;
  gratuity_rate_decimal: number;
  government_tax_percent: number;
  government_tax_decimal: number;
  payable_after_tax_percent: number;
  payable_after_tax_decimal: number;
  total_salary_earned: number;
  gratuity_before_tax: number;
  government_tax_deduction: number;
  net_gratuity_payable: number;
};

export type GratuityCalculationBreakdown = {
  monthly_salary: number;
  contract_months: number;
  service_start_date: string | null;
  service_end_date: string | null;
  source: "contract" | "calculation_record";
} & GratuityPaymentBreakdown;

export type GlobalGratuityRateSettings = {
  gratuity_rate_percent: number;
  government_tax_percent: number;
};

export function calculateContractGratuityEstimate(input: {
  monthlySalary: number | null | undefined;
  startDate: string | null | undefined;
  endDate: string | null | undefined;
  isGratuityEligible: boolean;
  gratuityRatePercent?: number;
  governmentTaxPercent?: number;
}): { contractMonths: number } & GratuityPaymentBreakdown {
  const contractMonths = calculateContractMonths(input.startDate, input.endDate);
  return {
    contractMonths,
    ...calculateGratuityPayment({
      monthlySalary: safeNumber(input.monthlySalary),
      contractMonths,
      isGratuityEligible: input.isGratuityEligible,
      gratuityRatePercent: input.gratuityRatePercent,
      governmentTaxPercent: input.governmentTaxPercent,
    }),
  };
}

const GRATUITY_RULE_SELECT = `
  id,
  rule_name,
  rule_code,
  description,
  contract_type,
  employment_type,
  calculation_basis,
  multiplier_value,
  percentage_value,
  minimum_service_months,
  include_allowances,
  rounding_rule,
  effective_from,
  effective_to,
  is_active,
  created_at
`;

const GRATUITY_CALCULATION_SELECT = `
  id,
  employee_id,
  contract_id,
  gratuity_rule_id,
  calculation_date,
  service_start_date,
  service_end_date,
  service_length_days,
  service_length_months,
  service_length_years,
  salary_basis_amount,
  allowance_basis_amount,
  total_basis_amount,
  calculated_amount,
  reviewed_amount,
  approved_amount,
  calculation_status,
  calculation_notes,
  override_reason,
  approved_at,
  created_at
`;

const GRATUITY_PAYMENT_SELECT = `
  id,
  employee_id,
  contract_id,
  gratuity_calculation_id,
  payment_date,
  payment_amount,
  payment_status,
  payment_reference,
  payment_notes,
  created_at
`;

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return JSON.stringify(error);
}

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function safeNumber(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return value;
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function parseIsoDateOnly(dateText: string | null | undefined): Date | null {
  if (!dateText) return null;
  const [y, m, d] = dateText.split("-");
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export function calculateContractMonths(
  startDate: string | null | undefined,
  endDate: string | null | undefined
): number {
  const start = parseIsoDateOnly(startDate);
  const end = parseIsoDateOnly(endDate);
  if (!start || !end || end < start) return 0;
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const inclusiveDays = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
  return Math.max(0, Math.floor(inclusiveDays / 30));
}

export type CalculateGratuityPaymentInput = {
  monthlySalary: number;
  contractMonths: number;
  isGratuityEligible: boolean;
  gratuityRatePercent?: number;
  governmentTaxPercent?: number;
};

/**
 * Net Gratuity Payable =
 * Monthly Salary × Contract Months × (Gratuity Rate % / 100) × (Payable After Tax % / 100)
 */
export function calculateGratuityPayment(
  input: CalculateGratuityPaymentInput
): GratuityPaymentBreakdown {
  const monthly = Math.max(0, safeNumber(input.monthlySalary));
  const contractMonths = Math.max(0, Math.floor(safeNumber(input.contractMonths)));
  const gratuityRatePercent = clampPercent(
    safeNumber(input.gratuityRatePercent ?? DEFAULT_GRATUITY_RATE_PERCENT)
  );
  const governmentTaxPercent = clampPercent(
    safeNumber(input.governmentTaxPercent ?? DEFAULT_GOVERNMENT_TAX_PERCENT)
  );
  const gratuityRateDecimal = roundCurrency(gratuityRatePercent / 100);
  const governmentTaxDecimal = roundCurrency(governmentTaxPercent / 100);
  const payableAfterTaxPercent = roundCurrency(100 - governmentTaxPercent);
  const payableAfterTaxDecimal = roundCurrency(payableAfterTaxPercent / 100);

  if (!input.isGratuityEligible) {
    return {
      is_eligible: false,
      ineligible_reason: "Gratuity is not applicable to this contract.",
      gratuity_rate_percent: gratuityRatePercent,
      gratuity_rate_decimal: gratuityRateDecimal,
      government_tax_percent: governmentTaxPercent,
      government_tax_decimal: governmentTaxDecimal,
      payable_after_tax_percent: payableAfterTaxPercent,
      payable_after_tax_decimal: payableAfterTaxDecimal,
      total_salary_earned: 0,
      gratuity_before_tax: 0,
      government_tax_deduction: 0,
      net_gratuity_payable: 0,
    };
  }

  if (contractMonths <= 0) {
    return {
      is_eligible: true,
      ineligible_reason: "Contract months must be greater than 0 before calculation.",
      gratuity_rate_percent: gratuityRatePercent,
      gratuity_rate_decimal: gratuityRateDecimal,
      government_tax_percent: governmentTaxPercent,
      government_tax_decimal: governmentTaxDecimal,
      payable_after_tax_percent: payableAfterTaxPercent,
      payable_after_tax_decimal: payableAfterTaxDecimal,
      total_salary_earned: 0,
      gratuity_before_tax: 0,
      government_tax_deduction: 0,
      net_gratuity_payable: 0,
    };
  }

  const totalSalaryEarned = roundCurrency(monthly * contractMonths);
  const gratuityBeforeTax = roundCurrency(totalSalaryEarned * gratuityRateDecimal);
  const governmentTaxDeduction = roundCurrency(gratuityBeforeTax * governmentTaxDecimal);
  const netGratuityPayable = roundCurrency(gratuityBeforeTax * payableAfterTaxDecimal);

  return {
    is_eligible: true,
    ineligible_reason: null,
    gratuity_rate_percent: gratuityRatePercent,
    gratuity_rate_decimal: gratuityRateDecimal,
    government_tax_percent: governmentTaxPercent,
    government_tax_decimal: governmentTaxDecimal,
    payable_after_tax_percent: payableAfterTaxPercent,
    payable_after_tax_decimal: payableAfterTaxDecimal,
    total_salary_earned: totalSalaryEarned,
    gratuity_before_tax: gratuityBeforeTax,
    government_tax_deduction: governmentTaxDeduction,
    net_gratuity_payable: netGratuityPayable,
  };
}

export async function calculateGratuityBreakdownForRecord(
  record: GratuityCalculationRecord
): Promise<GratuityCalculationBreakdown> {
  if (record.contract_id) {
    const contract = await getContractById(record.contract_id).catch(() => null);
    if (contract) {
      const monthlySalary = safeNumber(contract.salary_amount);
      const contractMonths = calculateContractMonths(contract.start_date, contract.end_date);
      return {
        monthly_salary: roundCurrency(monthlySalary),
        contract_months: contractMonths,
        service_start_date: contract.start_date,
        service_end_date: contract.end_date,
        source: "contract",
        ...calculateGratuityPayment({
          monthlySalary,
          contractMonths,
          isGratuityEligible: contract.is_gratuity_eligible === true,
        }),
      };
    }
  }

  const fallbackSalary = safeNumber(record.salary_basis_amount);
  const fallbackMonths =
    Math.max(0, Math.floor(safeNumber(record.service_length_months))) ||
    calculateContractMonths(record.service_start_date, record.service_end_date);

  return {
    monthly_salary: roundCurrency(fallbackSalary),
    contract_months: fallbackMonths,
    service_start_date: record.service_start_date,
    service_end_date: record.service_end_date,
    source: "calculation_record",
    ...calculateGratuityPayment({
      monthlySalary: fallbackSalary,
      contractMonths: fallbackMonths,
      isGratuityEligible: true,
    }),
  };
}

export async function listGratuityRules(): Promise<GratuityRuleRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gratuity_rules")
    .select(GRATUITY_RULE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listGratuityRules error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load gratuity rules: ${getErrorMessage(error)}`);
  }

  return data ?? [];
}

export async function getGlobalGratuityRateSettings(): Promise<GlobalGratuityRateSettings> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("gratuity_rules")
    .select("rule_code, percentage_value, is_active, created_at")
    .in("rule_code", [GRATUITY_RATE_RULE_CODE, GOVERNMENT_TAX_RULE_CODE])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getGlobalGratuityRateSettings error:", JSON.stringify(error, null, 2));
    return {
      gratuity_rate_percent: DEFAULT_GRATUITY_RATE_PERCENT,
      government_tax_percent: DEFAULT_GOVERNMENT_TAX_PERCENT,
    };
  }

  const rows = (data ?? []) as Array<{
    rule_code: string | null;
    percentage_value: number | null;
    is_active: boolean | null;
  }>;
  const activeRows = rows.filter((row) => row.is_active !== false);
  const gratuityRule = activeRows.find((row) => row.rule_code === GRATUITY_RATE_RULE_CODE);
  const taxRule = activeRows.find((row) => row.rule_code === GOVERNMENT_TAX_RULE_CODE);

  return {
    gratuity_rate_percent: clampPercent(
      safeNumber(gratuityRule?.percentage_value ?? DEFAULT_GRATUITY_RATE_PERCENT)
    ),
    government_tax_percent: clampPercent(
      safeNumber(taxRule?.percentage_value ?? DEFAULT_GOVERNMENT_TAX_PERCENT)
    ),
  };
}

export async function saveGlobalGratuityRateSettings(
  input: GlobalGratuityRateSettings
): Promise<void> {
  const supabase = await createClient();
  const gratuityRatePercent = clampPercent(safeNumber(input.gratuity_rate_percent));
  const governmentTaxPercent = clampPercent(safeNumber(input.government_tax_percent));

  const { data: existingRows, error: existingError } = await supabase
    .from("gratuity_rules")
    .select("id, rule_code")
    .in("rule_code", [GRATUITY_RATE_RULE_CODE, GOVERNMENT_TAX_RULE_CODE])
    .order("created_at", { ascending: false });

  if (existingError) {
    throw new Error(`Failed to load existing gratuity rules: ${getErrorMessage(existingError)}`);
  }

  const existingByCode = new Map<string, { id: string }>();
  for (const row of (existingRows ?? []) as Array<{ id: string; rule_code: string | null }>) {
    const ruleCode = (row.rule_code ?? "").trim();
    if (!ruleCode || existingByCode.has(ruleCode)) continue;
    existingByCode.set(ruleCode, { id: row.id });
  }

  const upsertRule = async (
    ruleCode: string,
    ruleName: string,
    percentageValue: number,
    description: string
  ) => {
    const existing = existingByCode.get(ruleCode);
    if (existing?.id) {
      const { error: updateError } = await supabase
        .from("gratuity_rules")
        .update({
          rule_name: ruleName,
          description,
          percentage_value: percentageValue,
          is_active: true,
        })
        .eq("id", existing.id);
      if (updateError) {
        throw new Error(`Failed to update gratuity rule (${ruleCode}): ${getErrorMessage(updateError)}`);
      }
      return;
    }

    const { error: insertError } = await supabase.from("gratuity_rules").insert({
      rule_name: ruleName,
      rule_code: ruleCode,
      description,
      percentage_value: percentageValue,
      is_active: true,
    });
    if (insertError) {
      throw new Error(`Failed to create gratuity rule (${ruleCode}): ${getErrorMessage(insertError)}`);
    }
  };

  await upsertRule(
    GRATUITY_RATE_RULE_CODE,
    "Global Gratuity Rate (%)",
    gratuityRatePercent,
    "System-wide gratuity rate used in gratuity calculations."
  );
  await upsertRule(
    GOVERNMENT_TAX_RULE_CODE,
    "Global Government Tax (%)",
    governmentTaxPercent,
    "System-wide government tax deduction used in gratuity calculations."
  );
}

export async function listGratuityCalculations(): Promise<
  GratuityCalculationRecord[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gratuity_calculations")
    .select(GRATUITY_CALCULATION_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "listGratuityCalculations error:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(
      `Failed to load gratuity calculations: ${getErrorMessage(error)}`
    );
  }

  return data ?? [];
}

export async function listGratuityPayments(): Promise<
  GratuityPaymentRecord[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gratuity_payments")
    .select(GRATUITY_PAYMENT_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listGratuityPayments error:", JSON.stringify(error, null, 2));
    throw new Error(
      `Failed to load gratuity payments: ${getErrorMessage(error)}`
    );
  }

  return data ?? [];
}

export async function listPendingGratuityCalculations(): Promise<
  GratuityCalculationRecord[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gratuity_calculations")
    .select(GRATUITY_CALCULATION_SELECT)
    .in("calculation_status", ["calculated", "under_review"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "listPendingGratuityCalculations error:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(
      `Failed to load pending gratuity calculations: ${getErrorMessage(error)}`
    );
  }

  return data ?? [];
}

export async function listApprovedUnpaidGratuityCalculations(): Promise<
  GratuityCalculationRecord[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gratuity_calculations")
    .select(GRATUITY_CALCULATION_SELECT)
    .in("calculation_status", ["approved", "overridden"])
    .not("approved_amount", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error(
      "listApprovedUnpaidGratuityCalculations error:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(
      `Failed to load approved unpaid gratuity calculations: ${getErrorMessage(
        error
      )}`
    );
  }

  return data ?? [];
}

export async function getGratuityCalculationById(
  id: string
): Promise<GratuityCalculationRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("gratuity_calculations")
    .select(GRATUITY_CALCULATION_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error(
      "getGratuityCalculationById error:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(
      `Failed to load gratuity calculation: ${getErrorMessage(error)}`
    );
  }

  return data ?? null;
}