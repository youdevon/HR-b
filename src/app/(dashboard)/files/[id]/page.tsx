import PageHeader from "@/components/layout/page-header";

type FileDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FileDetailPage({
  params,
}: FileDetailPageProps) {
  const { id } = await params;

  return (
    <main className="space-y-6">
      <PageHeader
        title="File Movement"
        description={`ID: ${id}`}
        backHref="/file-movements"
      />
    </main>
  );
}