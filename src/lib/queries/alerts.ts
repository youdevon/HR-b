export type AlertRecord = {
  id: string;
  title: string;
  severity: "Low" | "Medium" | "High";
  status: "Active" | "Resolved";
  employee_id: string;
  rule_name: string;
  created_at: string;
};

const mockAlerts: AlertRecord[] = [
  { id: "al_1", title: "Low Sick Leave Balance", severity: "High", status: "Active", employee_id: "emp_001", rule_name: "Low Sick Leave", created_at: "2026-04-20" },
  { id: "al_2", title: "Document Expiry Near", severity: "Medium", status: "Resolved", employee_id: "emp_003", rule_name: "Document Expiry", created_at: "2026-04-12" },
];

export async function listActiveAlerts(): Promise<AlertRecord[]> { return Promise.resolve(mockAlerts.filter((a) => a.status === "Active")); }
export async function listResolvedAlerts(): Promise<AlertRecord[]> { return Promise.resolve(mockAlerts.filter((a) => a.status === "Resolved")); }
export async function getAlertById(id: string): Promise<AlertRecord | null> { return Promise.resolve(mockAlerts.find((a) => a.id === id) ?? null); }
export async function listAlertRules(): Promise<{ id: string; name: string; condition: string; is_enabled: boolean }[]> {
  return Promise.resolve([
    { id: "rule_1", name: "Low Sick Leave", condition: "sick_leave_balance <= 3", is_enabled: true },
    { id: "rule_2", name: "Document Expiry", condition: "expiry_date <= 30 days", is_enabled: true },
  ]);
}
