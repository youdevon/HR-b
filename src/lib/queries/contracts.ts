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

export type ExpiringContractAlertRecord = ContractRecord & {
  days_to_expiry: number;
};

export type ExpiredContractAlertRecord = ContractRecord & {
  days_expired: number;
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

function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function plusDaysDateString(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateText: string | null): Date | null {
  if (!dateText) return null;
  const [yearText, monthText, dayText] = dateText.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function currentLocalDateAtMidnight(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

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

export async function listExpiringContracts(
  days = 30
): Promise<ExpiringContractAlertRecord[]> {
  const supabase = await createClient();
  const todayText = todayDateString();
  const withinDays = plusDaysDateString(days);

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .not("end_date", "is", null)
    .gte("end_date", todayText)
    .lte("end_date", withinDays)
    .order("end_date", { ascending: true });

  if (error) {
    console.error("listExpiringContracts error:", error);
    throw new Error(`Failed to load expiring contracts: ${error.message}`);
  }

  const today = currentLocalDateAtMidnight();
  const rows = (data ?? []).map((contract) => {
    const endDate = parseLocalDate(contract.end_date);
    const daysToExpiry = endDate
      ? Math.max(
          0,
          Math.ceil(
            (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    return {
      ...contract,
      days_to_expiry: daysToExpiry,
    };
  });

  rows.sort((a, b) => a.days_to_expiry - b.days_to_expiry);
  return rows;
}

export async function listExpiredContracts(): Promise<ExpiredContractAlertRecord[]> {
  const supabase = await createClient();
  const todayText = todayDateString();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .not("end_date", "is", null)
    .lt("end_date", todayText)
    .order("end_date", { ascending: false });

  if (error) {
    console.error("listExpiredContracts error:", error);
    throw new Error(`Failed to load expired contracts: ${error.message}`);
  }

  const today = currentLocalDateAtMidnight();
  const rows = (data ?? []).map((contract) => {
    const endDate = parseLocalDate(contract.end_date);
    const daysExpired = endDate
      ? Math.max(
          0,
          Math.floor(
            (today.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    return {
      ...contract,
      days_expired: daysExpired,
    };
  });

  rows.sort((a, b) => b.days_expired - a.days_expired);
  return rows;
}