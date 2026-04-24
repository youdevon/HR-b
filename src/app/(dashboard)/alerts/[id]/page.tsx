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
        <p className="mt-1 text-sm text-neutral-600">Alert ID: {id}</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">
          Alert detail data will be connected here.
        </p>
      </section>
    </main>
  );
}