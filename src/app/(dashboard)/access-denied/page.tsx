import Link from "next/link";
import PageHeader from "@/components/layout/page-header";

export default function AccessDeniedPage() {
  return (
    <main className="space-y-6">
      <PageHeader
        title="Access denied"
        description="You do not have permission to view this page. Ask an administrator to update your role permissions if you need access."
      />
      <div className="flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Go to Dashboard
        </Link>
      </div>
    </main>
  );
}
