export type AuditRecord = {
  id: string;
  actor: string;
  action: string;
  entity: string;
  category: "activity" | "sensitive";
  occurred_at: string;
  details: string;
};

const mockAudit: AuditRecord[] = [
  { id: "aud_1", actor: "admin@company.com", action: "Updated compensation", entity: "comp_1", category: "activity", occurred_at: "2026-04-22 09:45", details: "Salary updated from 11500 to 12000." },
  { id: "aud_2", actor: "officer@company.com", action: "Viewed employee document", entity: "doc_2", category: "sensitive", occurred_at: "2026-04-22 10:10", details: "Accessed passport copy." },
];

export async function listAuditActivity(): Promise<AuditRecord[]> { return Promise.resolve(mockAudit.filter((a) => a.category === "activity")); }
export async function listSensitiveAuditEvents(): Promise<AuditRecord[]> { return Promise.resolve(mockAudit.filter((a) => a.category === "sensitive")); }
export async function getAuditById(id: string): Promise<AuditRecord | null> { return Promise.resolve(mockAudit.find((a) => a.id === id) ?? null); }
