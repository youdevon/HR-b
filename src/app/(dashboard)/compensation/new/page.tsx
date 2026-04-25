import CompensationForm from "@/components/domain/compensation/compensation-form";
import PageHeader from "@/components/layout/page-header";

export default function NewCompensationPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6"><div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="New Compensation" backHref="/compensation/current" />
      <CompensationForm submitLabel="Create Compensation" />
    </div></main>
  );
}
