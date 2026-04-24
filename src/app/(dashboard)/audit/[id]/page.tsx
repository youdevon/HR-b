type AuditDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AuditDetailPage({
  params,
}: AuditDetailPageProps) {
  const { id } = await params;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          Audit Detail
        </h1>
        <p className="mt-1 text-sm text-neutral-600">
          Audit record ID: {id}
        </p>
      </div>
    </main>
  );
}