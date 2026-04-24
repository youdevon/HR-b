type AlertDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AlertDetailPage({
  params,
}: AlertDetailPageProps) {
  const { id } = await params;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Alert Details
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Alert ID: {id}
        </p>
      </div>
    </main>
  );
}