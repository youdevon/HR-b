import GratuitySummary from "@/components/domain/gratuity/gratuity-summary";

type Props = { params: { id: string } };

export default function GratuityDetailPage({ params }: Props) {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h1 className="text-2xl font-semibold">Gratuity {params.id}</h1>
        </section>
        <GratuitySummary employeeName="Ayesha Khan" status="Approved" calculatedAmount="32500.00" reviewedAmount="32000.00" approvedAmount="32000.00" />
      </div>
    </main>
  );
}
