import { getDocumentById } from "@/lib/queries/documents";
import PageHeader from "@/components/layout/page-header";
import { notFound } from "next/navigation";

type DocumentDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params;

  const document = await getDocumentById(id);

  if (!document) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <PageHeader
        title={document.document_title ?? "Document"}
        description={document.document_type ?? undefined}
        backHref="/documents"
      />
    </main>
  );
}