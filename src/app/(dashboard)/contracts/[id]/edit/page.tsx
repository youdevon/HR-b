type ContractEditPageProps = {
    params: Promise<{
      id: string;
    }>;
  };
  
  export default async function ContractEditPage({
    params,
  }: ContractEditPageProps) {
    const { id } = await params;
  
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Edit Contract
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Contract ID: {id}
          </p>
        </div>
  
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">
            Contract edit form will be connected here.
          </p>
        </section>
      </main>
    );
  }