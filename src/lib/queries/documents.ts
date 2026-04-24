import { createClient } from "@/lib/supabase/server";

export type DocumentRecord = {
  id: string;
  employee_id: string | null;
  employee_first_name: string | null;
  employee_last_name: string | null;
  employee_number: string | null;
  file_number: string | null;
  document_category: string | null;
  document_type: string | null;
  document_title: string | null;
  document_status: string | null;
  expiry_date: string | null;
  visibility_level: string | null;
  uploaded_at: string | null;
};

export type DocumentSearchParams = {
  query?: string;
};

const DOCUMENT_LIST_SELECT = `
  id,
  employee_id,
  document_category,
  document_type,
  document_title,
  document_status,
  expiry_date,
  visibility_level,
  uploaded_at
`;

type EmployeeDocRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  employee_number: string | null;
  file_number: string | null;
};

function includesText(value: string | null | undefined, query: string): boolean {
  if (!value) return false;
  return value.toLowerCase().includes(query);
}

async function enrichDocumentsWithEmployee(
  documents: Omit<
    DocumentRecord,
    "employee_first_name" | "employee_last_name" | "employee_number" | "file_number"
  >[]
): Promise<DocumentRecord[]> {
  const employeeIds = [
    ...new Set(
      documents
        .map((document) => document.employee_id)
        .filter((employeeId): employeeId is string => Boolean(employeeId))
    ),
  ];

  if (!employeeIds.length) {
    return documents.map((document) => ({
      ...document,
      employee_first_name: null,
      employee_last_name: null,
      employee_number: null,
      file_number: null,
    }));
  }

  const supabase = await createClient();
  const { data: employees, error: employeesError } = await supabase
    .from("employees")
    .select("id, first_name, last_name, employee_number, file_number")
    .in("id", employeeIds);

  if (employeesError) {
    throw new Error(`Failed to load employee data for documents: ${employeesError.message}`);
  }

  const employeeById = new Map(
    (employees ?? []).map((employee) => [employee.id, employee as EmployeeDocRow])
  );

  return documents.map((document) => {
    const employee = document.employee_id
      ? employeeById.get(document.employee_id)
      : undefined;
    return {
      ...document,
      employee_first_name: employee?.first_name ?? null,
      employee_last_name: employee?.last_name ?? null,
      employee_number: employee?.employee_number ?? null,
      file_number: employee?.file_number ?? null,
    };
  });
}

export async function listDocuments(
  params?: DocumentSearchParams
): Promise<DocumentRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_LIST_SELECT)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("listDocuments error:", error);
    throw new Error(`Failed to load documents: ${error.message}`);
  }

  const documents = await enrichDocumentsWithEmployee((data ?? []) as Omit<
    DocumentRecord,
    "employee_first_name" | "employee_last_name" | "employee_number" | "file_number"
  >[]);

  if (!queryText) {
    return documents;
  }

  const normalizedQuery = queryText.toLowerCase();
  return documents.filter((document) => {
    return (
      includesText(document.document_title, normalizedQuery) ||
      includesText(document.document_type, normalizedQuery) ||
      includesText(document.document_category, normalizedQuery) ||
      includesText(document.document_status, normalizedQuery) ||
      includesText(document.employee_first_name, normalizedQuery) ||
      includesText(document.employee_last_name, normalizedQuery) ||
      includesText(document.employee_number, normalizedQuery) ||
      includesText(document.file_number, normalizedQuery)
    );
  });
}

export async function listDocumentsByEmployeeId(
  employeeId: string
): Promise<DocumentRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_LIST_SELECT)
    .eq("employee_id", employeeId)
    .order("uploaded_at", { ascending: false });

  if (error) {
    console.error("listDocumentsByEmployeeId error:", error);
    throw new Error(`Failed to load employee documents: ${error.message}`);
  }

  return enrichDocumentsWithEmployee((data ?? []) as Omit<
    DocumentRecord,
    "employee_first_name" | "employee_last_name" | "employee_number" | "file_number"
  >[]);
}

export async function getDocumentById(
  id: string
): Promise<DocumentRecord | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_LIST_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("getDocumentById error:", error);
    throw new Error(`Failed to load document: ${error.message}`);
  }

  if (!data) return null;
  const [enriched] = await enrichDocumentsWithEmployee([
    data as Omit<
      DocumentRecord,
      "employee_first_name" | "employee_last_name" | "employee_number" | "file_number"
    >,
  ]);
  return enriched ?? null;
}

export async function listExpiringDocuments(): Promise<DocumentRecord[]> {
  const supabase = await createClient();

  const today = new Date();
  const in30Days = new Date();
  in30Days.setDate(today.getDate() + 30);

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_LIST_SELECT)
    .gte("expiry_date", today.toISOString().split("T")[0])
    .lte("expiry_date", in30Days.toISOString().split("T")[0])
    .order("expiry_date", { ascending: true });

  if (error) {
    console.error("listExpiringDocuments error:", error);
    throw new Error(`Failed to load expiring documents: ${error.message}`);
  }

  return enrichDocumentsWithEmployee((data ?? []) as Omit<
    DocumentRecord,
    "employee_first_name" | "employee_last_name" | "employee_number" | "file_number"
  >[]);
}

export async function listExpiredDocuments(): Promise<DocumentRecord[]> {
  const supabase = await createClient();

  const today = new Date();

  const { data, error } = await supabase
    .from("documents")
    .select(DOCUMENT_LIST_SELECT)
    .lt("expiry_date", today.toISOString().split("T")[0])
    .order("expiry_date", { ascending: false });

  if (error) {
    console.error("listExpiredDocuments error:", error);
    throw new Error(`Failed to load expired documents: ${error.message}`);
  }

  return enrichDocumentsWithEmployee((data ?? []) as Omit<
    DocumentRecord,
    "employee_first_name" | "employee_last_name" | "employee_number" | "file_number"
  >[]);
}