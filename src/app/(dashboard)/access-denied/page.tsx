import Link from "next/link";

export default function AccessDeniedPage() {
  return (
    <main className="flex min-h-[60vh] items-center justify-center">
      <section className="max-w-lg rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
          Access denied
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
          You do not have permission to view this page.
        </h1>
        <p className="mt-3 text-sm text-neutral-600">
          Ask an administrator to update your role permissions if you need access.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Go to Dashboard
        </Link>
      </section>
    </main>
  );
}
