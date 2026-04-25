import PageHeader from "@/components/layout/page-header";

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
        <PageHeader
          title="Edit Contract"
          description={`Contract ID: ${id}`}
          backHref={`/contracts/${id}`}
        />
  
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-neutral-600">
            Contract edit form will be connected here.
          </p>
        </section>
      </main>
    );
  }