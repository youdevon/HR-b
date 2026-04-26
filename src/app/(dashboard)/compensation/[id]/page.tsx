import Link from "next/link";
import PageHeader from "@/components/layout/page-header";

type CompensationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CompensationDetailPage({ params }: CompensationDetailPageProps) {
  await params;

  return (
    <main className="space-y-6">
        <PageHeader
          title="Compensation"
          description="This module is temporarily disabled in the active application."
          backHref="/dashboard"
        />
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
          Compensation has been temporarily removed from active workflows. Data remains in the database for future reactivation.
          <div className="mt-4">
            <Link href="/dashboard" className="font-medium text-neutral-900 underline underline-offset-4">
              Return to dashboard
            </Link>
          </div>
        </section>
    
    </main>
  );
}
