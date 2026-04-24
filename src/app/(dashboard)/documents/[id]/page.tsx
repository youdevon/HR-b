import { getDocumentById } from "@/lib/queries/documents";
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
      <h1 className="text-2xl font-semibold text-neutral-900">
        {document.document_title}
      </h1>
    </main>
  );
}