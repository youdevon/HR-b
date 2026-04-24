import { createClient } from "@/lib/supabase/server";

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