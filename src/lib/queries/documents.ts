import { createClient } from "@/lib/supabase/server";

export type DocumentRecord = {
  id: string;
  employee_id: string | null;
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

export async function listDocuments(
  params?: DocumentSearchParams
): Promise<DocumentRecord[]> {
  const supabase = await createClient();
  const queryText = params?.query?.trim();

  let query = supabase
    .from("documents")
    .select(DOCUMENT_LIST_SELECT)
    .order("uploaded_at", { ascending: false });

  if (queryText) {
    query = query.or(
      [
        `document_title.ilike.%${queryText}%`,
        `document_type.ilike.%${queryText}%`,
        `document_category.ilike.%${queryText}%`,
        `document_status.ilike.%${queryText}%`,
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("listDocuments error:", error);
    throw new Error(`Failed to load documents: ${error.message}`);
  }

  return data ?? [];
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

  return data ?? null;
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

  return data ?? [];
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

  return data ?? [];
}