import { documentSchema, type Document, type DocumentInput } from "@/lib/validators/document";

export type DocumentRecord = Document & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type DocumentSearchParams = {
  query?: string;
  category?: Document["document_category"];
  status?: string;
};

const mockDocuments: DocumentRecord[] = [
  {
    id: "doc_1",
    employee_id: "emp_001",
    contract_id: "ctr_1",
    leave_transaction_id: "",
    gratuity_calculation_id: "",
    file_movement_id: "",
    document_category: "Contract",
    document_type: "Employment Agreement",
    document_title: "Standard Employment Contract 2026",
    document_description: "Signed contract for annual term.",
    file_name: "employment-contract-2026.pdf",
    document_status: "Active",
    document_date: "2026-01-01",
    issued_date: "2025-12-20",
    expiry_date: "2027-12-31",
    visibility_level: "HR_ONLY",
    notes: "Original copy in records room.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "doc_2",
    employee_id: "emp_002",
    contract_id: "",
    leave_transaction_id: "",
    gratuity_calculation_id: "",
    file_movement_id: "mov_2",
    document_category: "Physical File",
    document_type: "Transfer Acknowledgment",
    document_title: "File Transfer to Finance",
    document_description: "",
    file_name: "transfer-finance.pdf",
    document_status: "Expiring",
    document_date: "2026-03-15",
    issued_date: "2026-03-15",
    expiry_date: "2026-05-01",
    visibility_level: "INTERNAL",
    notes: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function listDocuments(_params?: DocumentSearchParams): Promise<DocumentRecord[]> {
  // Placeholder for future Supabase select query.
  return Promise.resolve(mockDocuments);
}

export async function getDocumentById(id: string): Promise<DocumentRecord | null> {
  // Placeholder for future Supabase select query.
  return Promise.resolve(mockDocuments.find((doc) => doc.id === id) ?? null);
}

export async function createDocument(input: DocumentInput): Promise<DocumentRecord> {
  const parsed = documentSchema.parse(input);
  const now = new Date().toISOString();
  return Promise.resolve({
    id: `doc_${Date.now()}`,
    ...parsed,
    created_at: now,
    updated_at: now,
  });
}

export async function updateDocument(id: string, input: Partial<DocumentInput>): Promise<DocumentRecord> {
  const existing = await getDocumentById(id);
  if (!existing) {
    throw new Error("Document not found.");
  }

  const parsed = documentSchema.parse({ ...existing, ...input });
  return Promise.resolve({
    ...existing,
    ...parsed,
    updated_at: new Date().toISOString(),
  });
}

export async function listExpiringDocuments(): Promise<DocumentRecord[]> {
  const all = await listDocuments();
  return Promise.resolve(all.filter((doc) => doc.document_status.toLowerCase() === "expiring"));
}

export async function listExpiredDocuments(): Promise<DocumentRecord[]> {
  const all = await listDocuments();
  return Promise.resolve(all.filter((doc) => doc.document_status.toLowerCase() === "expired"));
}
