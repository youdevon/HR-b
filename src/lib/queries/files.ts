import { fileMovementSchema, type FileMovement, type FileMovementInput } from "@/lib/validators/file-movement";

export type FileMovementRecord = FileMovement & {
  id: string;
  created_at: string;
  updated_at: string;
};

export type FileMovementSearchParams = {
  query?: string;
  movement_status?: FileMovement["movement_status"];
};

const mockMovements: FileMovementRecord[] = [
  {
    id: "mov_1",
    employee_id: "emp_001",
    file_number: "FILE-1001",
    from_department: "HR",
    to_department: "Finance",
    from_location: "Cabinet A3",
    to_location: "Finance Vault 1",
    from_custodian: "Sarah Ali",
    to_custodian: "Rami Noor",
    date_sent: "2026-04-01",
    date_received: "2026-04-02",
    movement_status: "received",
    movement_reason: "Payroll verification",
    remarks: "Returned in good condition.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mov_2",
    employee_id: "emp_002",
    file_number: "FILE-1002",
    from_department: "HR",
    to_department: "Operations",
    from_location: "Cabinet B1",
    to_location: "Ops Shelf 4",
    from_custodian: "Sarah Ali",
    to_custodian: "Omar Nabil",
    date_sent: "2026-04-18",
    date_received: "",
    movement_status: "in_transit",
    movement_reason: "Internal audit",
    remarks: "",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "mov_3",
    employee_id: "emp_003",
    file_number: "FILE-1003",
    from_department: "HR",
    to_department: "Legal",
    from_location: "Archive Room",
    to_location: "Legal Desk",
    from_custodian: "Mira Patel",
    to_custodian: "Nina Solis",
    date_sent: "2026-03-10",
    date_received: "",
    movement_status: "missing",
    movement_reason: "Case documentation",
    remarks: "Last tracked during transfer checkpoint.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function listFileMovements(_params?: FileMovementSearchParams): Promise<FileMovementRecord[]> {
  // Placeholder for future Supabase select query.
  return Promise.resolve(mockMovements);
}

export async function getFileMovementById(id: string): Promise<FileMovementRecord | null> {
  // Placeholder for future Supabase select query.
  return Promise.resolve(mockMovements.find((item) => item.id === id) ?? null);
}

export async function createFileMovement(input: FileMovementInput): Promise<FileMovementRecord> {
  const parsed = fileMovementSchema.parse(input);
  const now = new Date().toISOString();
  return Promise.resolve({
    id: `mov_${Date.now()}`,
    ...parsed,
    created_at: now,
    updated_at: now,
  });
}

export async function updateFileMovement(id: string, input: Partial<FileMovementInput>): Promise<FileMovementRecord> {
  const existing = await getFileMovementById(id);
  if (!existing) {
    throw new Error("File movement not found.");
  }

  const parsed = fileMovementSchema.parse({ ...existing, ...input });
  return Promise.resolve({
    ...existing,
    ...parsed,
    updated_at: new Date().toISOString(),
  });
}

export async function listInTransitFiles(): Promise<FileMovementRecord[]> {
  const all = await listFileMovements();
  return Promise.resolve(all.filter((item) => item.movement_status === "in_transit"));
}

export async function listMissingFiles(): Promise<FileMovementRecord[]> {
  const all = await listFileMovements();
  return Promise.resolve(all.filter((item) => item.movement_status === "missing"));
}
