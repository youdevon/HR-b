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
      <h1 className="text-2xl font-semibold text-neutral-900">
        File Movement
      </h1>
      <p>ID: {id}</p>
    </main>
  );
}