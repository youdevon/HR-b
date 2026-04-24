type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Edit employee</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Update profile and employment details for this employee record.
        </p>
        <p className="mt-2 font-mono text-xs text-neutral-500">ID: {id}</p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-neutral-600">Employee edit form will be connected here.</p>
      </section>
    </main>
  );
}
