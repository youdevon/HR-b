import { createClient } from "@/lib/supabase/server";

export type ContractRecord = {
  id: string;
  employee_id: string | null;
  contract_number: string | null;
  contract_title: string | null;
  contract_type: string | null;
  contract_status: string | null;
  start_date: string | null;
  end_date: string | null;
  department: string | null;
  job_title: string | null;
  salary_amount: number | null;
  salary_frequency: string | null;
  is_gratuity_eligible: boolean | null;
  created_at: string | null;
};

export type ContractSearchParams = {
  query?: string;
};

const CONTRACT_LIST_SELECT = `
  id,
  employee_id,
  contract_number,
  contract_title,
  contract_type,
  contract_status,
  start_date,
  end_date,
  department,
  job_title,
  salary_amount,
  salary_frequency,
  is_gratuity_eligible,
  created_at
`;

export async function listContracts(
  params?: ContractSearchParams
): Promise<ContractRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();

  let query = supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (queryText) {
    query = query.or(
      [
        `contract_number.ilike.%${queryText}%`,
        `contract_title.ilike.%${queryText}%`,
        `contract_type.ilike.%${queryText}%`,
        `contract_status.ilike.%${queryText}%`,
        `department.ilike.%${queryText}%`,
        `job_title.ilike.%${queryText}%`,
        `salary_frequency.ilike.%${queryText}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("listContracts error:", error);
    throw new Error(`Failed to load contracts: ${error.message}`);
  }

  return data ?? [];
}

export async function getContractById(
  id: string
): Promise<ContractRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getContractById error:", error);
    throw new Error(`Failed to load contract: ${error.message}`);
  }

  return data ?? null;
}

export async function listContractsByEmployeeId(
  employeeId: string
): Promise<ContractRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .eq("employee_id", employeeId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listContractsByEmployeeId error:", error);
    throw new Error(`Failed to load employee contracts: ${error.message}`);
  }

  return data ?? [];
}