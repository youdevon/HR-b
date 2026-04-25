import { createClient } from "@/lib/supabase/server";

export type ContractRecord = {
  id: string;
  employee_id: string | null;

  employee_name: string | null;
  employee_first_name: string | null;
  employee_last_name: string | null;
  employee_number: string | null;

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

  probation_end_date: string | null;
  renewal_due_date: string | null;
  renewal_status: string | null;
  confirmation_status: string | null;
  renewal_notes: string | null;
  hr_owner: string | null;

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

export type ContractLifecycleAction =
  | "renew_contract"
  | "confirm_employee"
  | "extend_probation";

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
  probation_end_date,
  renewal_due_date,
  renewal_status,
  confirmation_status,
  renewal_notes,
  hr_owner,
  created_at
`;

// SQL guidance if the column is missing:
// alter table public.contracts
// add column if not exists is_gratuity_eligible boolean not null default false;

type ContractDatabaseRow = {
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
  probation_end_date: string | null;
  renewal_due_date: string | null;
  renewal_status: string | null;
  confirmation_status: string | null;
  renewal_notes: string | null;
  hr_owner: string | null;
  created_at: string | null;
};

type EmployeeNameRow = {
  id: string;
  employee_number: string | null;
  first_name: string | null;
  last_name: string | null;
};

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

function includesText(value: string | null | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

function buildEmployeeName(firstName?: string | null, lastName?: string | null) {
  const name = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return name || null;
}

async function enrichContractsWithEmployeeNames(
  contracts: ContractDatabaseRow[]
): Promise<ContractRecord[]> {
  const employeeIds = [
    ...new Set(
      contracts
        .map((contract) => contract.employee_id)
        .filter((employeeId): employeeId is string => Boolean(employeeId))
    ),
  ];

  if (!employeeIds.length) {
    return contracts.map((contract) => ({
      ...contract,
      employee_name: null,
      employee_first_name: null,
      employee_last_name: null,
      employee_number: null,
    }));
  }

  const supabase = await createClient();

  const { data: employees, error } = await supabase
    .from("employees")
    .select("id, employee_number, first_name, last_name")
    .in("id", employeeIds);

  if (error) {
    throw new Error(
      `Failed to load employee names for contracts: ${error.message}`
    );
  }

  const employeeById = new Map(
    (employees ?? []).map((employee) => [
      employee.id,
      employee as EmployeeNameRow,
    ])
  );

  return contracts.map((contract) => {
    const employee = contract.employee_id
      ? employeeById.get(contract.employee_id)
      : undefined;

    return {
      ...contract,
      employee_name: buildEmployeeName(
        employee?.first_name,
        employee?.last_name
      ),
      employee_first_name: employee?.first_name ?? null,
      employee_last_name: employee?.last_name ?? null,
      employee_number: employee?.employee_number ?? null,
    };
  });
}

export async function listContracts(
  params?: ContractSearchParams
): Promise<ContractRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listContracts error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load contracts: ${error.message}`);
  }

  const contracts = await enrichContractsWithEmployeeNames(
    (data ?? []) as ContractDatabaseRow[]
  );

  if (!queryText) {
    return contracts;
  }

  const normalizedQuery = queryText.toLowerCase();

  return contracts.filter((contract) => {
    return (
      includesText(contract.contract_number, normalizedQuery) ||
      includesText(contract.contract_title, normalizedQuery) ||
      includesText(contract.contract_type, normalizedQuery) ||
      includesText(contract.contract_status, normalizedQuery) ||
      includesText(contract.department, normalizedQuery) ||
      includesText(contract.job_title, normalizedQuery) ||
      includesText(contract.employee_name, normalizedQuery) ||
      includesText(contract.employee_first_name, normalizedQuery) ||
      includesText(contract.employee_last_name, normalizedQuery) ||
      includesText(contract.employee_number, normalizedQuery)
    );
  });
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
    console.error("getContractById error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load contract: ${error.message}`);
  }

  if (!data) return null;

  const [contract] = await enrichContractsWithEmployeeNames([
    data as ContractDatabaseRow,
  ]);

  return contract ?? null;
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
    console.error(
      "listContractsByEmployeeId error:",
      JSON.stringify(error, null, 2)
    );
    throw new Error(`Failed to load employee contracts: ${error.message}`);
  }

  return enrichContractsWithEmployeeNames((data ?? []) as ContractDatabaseRow[]);
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
    console.error("listExpiringContracts error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load expiring contracts: ${error.message}`);
  }

  const enriched = await enrichContractsWithEmployeeNames(
    (data ?? []) as ContractDatabaseRow[]
  );

  const today = currentLocalDateAtMidnight();

  const rows = enriched.map((contract) => {
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

export async function listExpiredContracts(): Promise<
  ExpiredContractAlertRecord[]
> {
  const supabase = await createClient();
  const todayText = todayDateString();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .not("end_date", "is", null)
    .lt("end_date", todayText)
    .order("end_date", { ascending: false });

  if (error) {
    console.error("listExpiredContracts error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load expired contracts: ${error.message}`);
  }

  const enriched = await enrichContractsWithEmployeeNames(
    (data ?? []) as ContractDatabaseRow[]
  );

  const today = currentLocalDateAtMidnight();

  const rows = enriched.map((contract) => {
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

export async function listOverdueRenewals(): Promise<ContractRecord[]> {
  const supabase = await createClient();
  const todayText = todayDateString();

  const { data, error } = await supabase
    .from("contracts")
    .select(CONTRACT_LIST_SELECT)
    .not("renewal_due_date", "is", null)
    .lt("renewal_due_date", todayText)
    .neq("renewal_status", "renewed")
    .order("renewal_due_date", { ascending: true });

  if (error) {
    throw new Error(`Failed to load overdue renewals: ${error.message}`);
  }

  return enrichContractsWithEmployeeNames((data ?? []) as ContractDatabaseRow[]);
}

export async function countOverdueRenewals(): Promise<number> {
  const supabase = await createClient();
  const todayText = todayDateString();

  const { count, error } = await supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .not("renewal_due_date", "is", null)
    .lt("renewal_due_date", todayText)
    .neq("renewal_status", "renewed");

  if (error) {
    throw new Error(`Failed to count overdue renewals: ${error.message}`);
  }

  return count ?? 0;
}

export async function countPendingConfirmations(): Promise<number> {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("contracts")
    .select("id", { head: true, count: "exact" })
    .in("confirmation_status", ["pending", "for_confirmation"]);

  if (error) {
    throw new Error(`Failed to count pending confirmations: ${error.message}`);
  }

  return count ?? 0;
}

export async function applyContractLifecycleAction(input: {
  id: string;
  action: ContractLifecycleAction;
  start_date?: string;
  end_date?: string;
  renewal_due_date?: string;
  probation_end_date?: string;
  renewal_notes?: string;
  hr_owner?: string;
}): Promise<ContractRecord> {
  const supabase = await createClient();
  const now = new Date().toISOString().slice(0, 10);

  const { data: existing, error: existingError } = await supabase
    .from("contracts")
    .select("id, employee_id, end_date")
    .eq("id", input.id)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(
      `Failed to load contract for lifecycle update: ${
        existingError?.message ?? "Contract not found."
      }`
    );
  }

  const renewalStartDate = input.start_date?.trim() ?? "";
  const renewalEndDate = input.end_date?.trim() ?? "";

  let patch: Record<string, string | null> = {};

  if (input.action === "renew_contract") {
    const renewalDueDate = input.renewal_due_date?.trim() ?? "";
    const renewalNotes = input.renewal_notes?.trim() ?? "";

    if (!renewalStartDate || !renewalEndDate) {
      throw new Error("Renewal requires both start and end dates.");
    }
    if (!renewalDueDate) {
      throw new Error("Renewal due date is required.");
    }
    if (!renewalNotes) {
      throw new Error("Renewal notes are required.");
    }

    if (renewalEndDate < renewalStartDate) {
      throw new Error("Renewal end date cannot be earlier than renewal start date.");
    }

    if (existing.end_date && renewalStartDate <= existing.end_date) {
      throw new Error(
        "Contract dates overlap with an existing contract for this employee."
      );
    }

    await assertNoContractDateOverlap({
      employeeId: existing.employee_id,
      newStartDate: renewalStartDate,
      newEndDate: renewalEndDate,
      excludeContractId: input.id,
    });

    patch = {
      start_date: renewalStartDate,
      end_date: renewalEndDate,
      renewal_status: "renewed",
      contract_status: "active",
      renewal_due_date: renewalDueDate,
      renewal_notes: renewalNotes,
      hr_owner: input.hr_owner?.trim() || null,
    };
  }

  if (input.action === "confirm_employee") {
    patch = {
      confirmation_status: "confirmed",
      probation_end_date: input.probation_end_date?.trim() || now,
    };
  }

  if (input.action === "extend_probation") {
    patch = {
      confirmation_status: "pending",
      probation_end_date: input.probation_end_date?.trim() || null,
      renewal_notes: input.renewal_notes?.trim() || null,
      hr_owner: input.hr_owner?.trim() || null,
    };
  }

  if (!Object.keys(patch).length) {
    throw new Error("Unsupported contract lifecycle action.");
  }

  const { data, error } = await supabase
    .from("contracts")
    .update(patch)
    .eq("id", input.id)
    .select(CONTRACT_LIST_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to apply lifecycle action: ${error.message}`);
  }

  const [enriched] = await enrichContractsWithEmployeeNames([
    data as ContractDatabaseRow,
  ]);

  return enriched;
}

async function assertNoContractDateOverlap(input: {
  employeeId: string | null;
  newStartDate: string;
  newEndDate: string;
  excludeContractId?: string;
}): Promise<void> {
  if (!input.employeeId) return;

  const supabase = await createClient();

  let query = supabase
    .from("contracts")
    .select("id, start_date, end_date")
    .eq("employee_id", input.employeeId);

  if (input.excludeContractId) {
    query = query.neq("id", input.excludeContractId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(
      `Failed to validate contract date overlap: ${error.message}`
    );
  }

  const hasOverlap = (data ?? []).some((contract) => {
    const existingStartDate = contract.start_date as string | null;
    const existingEndDate =
      (contract.end_date as string | null) ?? "9999-12-31";

    if (!existingStartDate) return false;

    return (
      input.newStartDate <= existingEndDate &&
      input.newEndDate >= existingStartDate
    );
  });

  if (hasOverlap) {
    throw new Error(
      "Contract dates overlap with an existing contract for this employee."
    );
  }
}

export async function validateContractDateOverlap(input: {
  employeeId: string | null;
  newStartDate: string;
  newEndDate: string;
  excludeContractId?: string;
}): Promise<void> {
  await assertNoContractDateOverlap(input);
}

type UpdateContractDetailsInput = {
  id: string;
  contract_number: string;
  contract_title: string;
  contract_type: string;
  contract_status: string;
  start_date: string;
  end_date: string | null;
  effective_date: string | null;
  notice_period: string | null;
  job_title: string | null;
  department: string | null;
  signed_date: string | null;
  issued_date: string | null;
  salary_amount: number | null;
  salary_frequency: string | null;
  is_gratuity_eligible: boolean;
};

export async function updateContractDetails(
  input: UpdateContractDetailsInput
): Promise<ContractRecord> {
  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("contracts")
    .select("id, employee_id")
    .eq("id", input.id)
    .maybeSingle();

  if (existingError || !existing) {
    throw new Error(
      `Failed to load contract for update: ${
        existingError?.message ?? "Contract not found."
      }`
    );
  }

  const effectiveEndDate = input.end_date ?? input.start_date;
  await assertNoContractDateOverlap({
    employeeId: existing.employee_id as string | null,
    newStartDate: input.start_date,
    newEndDate: effectiveEndDate,
    excludeContractId: input.id,
  });

  const { data, error } = await supabase
    .from("contracts")
    .update({
      contract_number: input.contract_number,
      contract_title: input.contract_title,
      contract_type: input.contract_type,
      contract_status: input.contract_status,
      start_date: input.start_date,
      end_date: input.end_date,
      effective_date: input.effective_date,
      notice_period: input.notice_period,
      job_title: input.job_title,
      department: input.department,
      signed_date: input.signed_date,
      issued_date: input.issued_date,
      salary_amount: input.salary_amount,
      salary_frequency: input.salary_frequency,
      is_gratuity_eligible: input.is_gratuity_eligible,
    })
    .eq("id", input.id)
    .select(CONTRACT_LIST_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update contract: ${error.message}`);
  }

  const [enriched] = await enrichContractsWithEmployeeNames([
    data as ContractDatabaseRow,
  ]);
  if (!enriched) {
    throw new Error("Contract was updated but could not be loaded.");
  }
  return enriched;
}

export async function generateContractLifecycleAlerts(): Promise<number> {
  const supabase = await createClient();
  const today = todayDateString();
  const in30Days = plusDaysDateString(30);

  const { data: expiring, error: expiringError } = await supabase
    .from("contracts")
    .select("id, employee_id, contract_number, end_date")
    .not("end_date", "is", null)
    .gte("end_date", today)
    .lte("end_date", in30Days);

  if (expiringError) {
    throw new Error(
      `Failed loading expiring contracts for alerts: ${expiringError.message}`
    );
  }

  const { data: overdue, error: overdueError } = await supabase
    .from("contracts")
    .select("id, employee_id, contract_number, renewal_due_date")
    .not("renewal_due_date", "is", null)
    .lt("renewal_due_date", today)
    .neq("renewal_status", "renewed");

  if (overdueError) {
    throw new Error(
      `Failed loading overdue renewals for alerts: ${overdueError.message}`
    );
  }

  const payload = [
    ...(expiring ?? []).map((row) => ({
      correlation_id: `contract-expiring-${row.id}`,
      alert_title: "Contract Expiring Soon",
      alert_message: `Contract ${
        row.contract_number ?? row.id
      } expires on ${row.end_date}.`,
      module_name: "Contracts",
      severity_level: "warning",
      status: "active",
      entity_type: "contract",
      entity_id: row.id,
      employee_id: row.employee_id,
      triggered_at: new Date().toISOString(),
    })),
    ...(overdue ?? []).map((row) => ({
      correlation_id: `contract-renewal-overdue-${row.id}`,
      alert_title: "Overdue Renewal",
      alert_message: `Contract ${
        row.contract_number ?? row.id
      } renewal overdue since ${row.renewal_due_date}.`,
      module_name: "Contracts",
      severity_level: "critical",
      status: "active",
      entity_type: "contract",
      entity_id: row.id,
      employee_id: row.employee_id,
      triggered_at: new Date().toISOString(),
    })),
  ];

  if (!payload.length) return 0;

  const { error: upsertError } = await supabase
    .from("alerts")
    .upsert(payload, { onConflict: "correlation_id" });

  if (upsertError) {
    throw new Error(
      `Failed upserting contract lifecycle alerts: ${upsertError.message}`
    );
  }

  return payload.length;
}