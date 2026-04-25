import PageHeader from "@/components/layout/page-header";
import Link from "next/link";

export default function Page() {
  return (
    <main className="space-y-6">
      <PageHeader
        title="Documents report"
        description="This module is temporarily disabled in the active application."
        backHref="/reports"
      />
      <section className="rounded-2xl border border-neutral-200 bg-white p-6 text-sm text-neutral-700 shadow-sm">
        Documents reporting is temporarily disabled in the active application.
        <div className="mt-4">
          <Link href="/reports" className="font-medium text-neutral-900 underline underline-offset-4">
            Return to reports
          </Link>
        </div>
      </section>
    </main>
  );
}
