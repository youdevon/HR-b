import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
export default function NewDocumentPage() {
  return (
    <main className="space-y-6">
        <PageHeader
          title="New Document"
          description="This module is temporarily disabled in the active application."
          backHref="/dashboard"
        />
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
          New document creation is temporarily disabled. Data structures remain intact for future reactivation.
          <div className="mt-4">
            <Link href="/dashboard" className="font-medium text-neutral-900 underline underline-offset-4">
              Return to dashboard
            </Link>
          </div>
        </section>
    
    </main>
  );
}
