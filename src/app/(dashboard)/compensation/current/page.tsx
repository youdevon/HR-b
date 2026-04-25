import Link from "next/link";
import PageHeader from "@/components/layout/page-header";

export default function CompensationCurrentPage() {
  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Current Compensation"
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
      </div>
    </main>
  );
}
