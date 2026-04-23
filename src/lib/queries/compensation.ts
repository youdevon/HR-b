import { compensationSchema, type Compensation, type CompensationInput } from "@/lib/validators/compensation";

export type CompensationRecord = Compensation & { id: string; created_at: string; updated_at: string };

const mock: CompensationRecord[] = [
  {
    id: "comp_1",
    employee_id: "emp_001",
    contract_id: "ctr_1",
    salary_amount: "12000.00",
    salary_frequency: "Monthly",
    allowance_amount: "1500.00",
    allowance_notes: "Housing allowance",
    currency: "AED",
    effective_from: "2026-01-01",
    effective_to: "",
    compensation_status: "Active",
    change_type: "Initial",
    change_reason: "",
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function listCurrentCompensation(): Promise<CompensationRecord[]> {
  return Promise.resolve(mock.filter((m) => m.compensation_status === "Active"));
}

export async function listCompensationHistory(): Promise<CompensationRecord[]> {
  return Promise.resolve(mock);
}

export async function getCompensationById(id: string): Promise<CompensationRecord | null> {
  return Promise.resolve(mock.find((m) => m.id === id) ?? null);
}

export async function createCompensation(input: CompensationInput): Promise<CompensationRecord> {
  const parsed = compensationSchema.parse(input);
  const now = new Date().toISOString();
  return Promise.resolve({ id: `comp_${Date.now()}`, ...parsed, created_at: now, updated_at: now });
}
