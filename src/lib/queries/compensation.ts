import { createClient } from "@/lib/supabase/server";

/** Row shape for `public.salary_history` (read queries). */
export type CompensationRecord = {
  id: string;
  employee_id: string | null;
  contract_id: string | null;
  salary_amount: number | string | null;
  salary_frequency: string | null;
  allowance_amount: number | string | null;
  allowance_notes: string | null;
  currency: string | null;
  effective_from: string | null;
  effective_to: string | null;
  compensation_status: string | null;
  change_type: string | null;
  change_reason: string | null;
  notes: string | null;
  created_at: string | null;
};

const SALARY_HISTORY_SELECT = `
  id,
  employee_id,
  contract_id,
  salary_amount,
  salary_frequency,
  allowance_amount,
  allowance_notes,
  currency,
  effective_from,
  effective_to,
  compensation_status,
  change_type,
  change_reason,
  notes,
  created_at
`;

export async function listCurrentCompensation(): Promise<CompensationRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salary_history")
    .select(SALARY_HISTORY_SELECT)
    .eq("compensation_status", "active")
    .order("effective_from", { ascending: false });

  if (error) {
    console.error("listCurrentCompensation error:", error);
    throw new Error(`Failed to load current compensation: ${error.message}`);
  }

  return data ?? [];
}

export async function listCompensationHistory(): Promise<CompensationRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salary_history")
    .select(SALARY_HISTORY_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listCompensationHistory error:", error);
    throw new Error(`Failed to load compensation history: ${error.message}`);
  }

  return data ?? [];
}

export async function getCompensationById(
  id: string
): Promise<CompensationRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("salary_history")
    .select(SALARY_HISTORY_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getCompensationById error:", error);
    throw new Error(`Failed to load compensation record: ${error.message}`);
  }

  return data ?? null;
}
