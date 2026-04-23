import { gratuitySchema, type Gratuity, type GratuityInput } from "@/lib/validators/gratuity";

export type GratuityRecord = Gratuity & { id: string; employee_name: string; created_at: string; updated_at: string };

const mock: GratuityRecord[] = [
  {
    id: "gr_1",
    employee_id: "emp_001",
    employee_name: "Ayesha Khan",
    contract_id: "ctr_1",
    gratuity_rule_id: "rule_1",
    calculation_date: "2026-04-01",
    service_start_date: "2020-07-01",
    service_end_date: "2026-04-01",
    salary_basis_amount: "12000.00",
    allowance_basis_amount: "1500.00",
    total_basis_amount: "13500.00",
    calculated_amount: "32500.00",
    reviewed_amount: "32000.00",
    approved_amount: "32000.00",
    calculation_status: "Approved",
    override_reason: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "gr_2",
    employee_id: "emp_002",
    employee_name: "Mark Dela Cruz",
    contract_id: "ctr_2",
    gratuity_rule_id: "rule_1",
    calculation_date: "2026-04-15",
    service_start_date: "2022-01-01",
    service_end_date: "2026-04-15",
    salary_basis_amount: "10000.00",
    allowance_basis_amount: "1000.00",
    total_basis_amount: "11000.00",
    calculated_amount: "18000.00",
    reviewed_amount: "18000.00",
    approved_amount: "0.00",
    calculation_status: "Pending Review",
    override_reason: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function listGratuityCalculations(): Promise<GratuityRecord[]> { return Promise.resolve(mock); }
export async function listPendingReviewGratuity(): Promise<GratuityRecord[]> { return Promise.resolve(mock.filter((m) => m.calculation_status === "Pending Review")); }
export async function listApprovedUnpaidGratuity(): Promise<GratuityRecord[]> { return Promise.resolve(mock.filter((m) => m.calculation_status === "Approved" && m.approved_amount !== "0.00")); }
export async function getGratuityById(id: string): Promise<GratuityRecord | null> { return Promise.resolve(mock.find((m) => m.id === id) ?? null); }
export async function createGratuityCalculation(input: GratuityInput): Promise<GratuityRecord> {
  const parsed = gratuitySchema.parse(input);
  const now = new Date().toISOString();
  return Promise.resolve({ id: `gr_${Date.now()}`, employee_name: "Placeholder Employee", ...parsed, created_at: now, updated_at: now });
}
