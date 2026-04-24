import Link from "next/link";
import { listDocuments } from "@/lib/queries/documents";

type DocumentsPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const resolved = await searchParams;
  const query = resolved.q?.trim() ?? "";
  const documents = await listDocuments({ query });

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Documents</h1>
            <p className="mt-1 text-sm text-neutral-600">Search and manage document records.</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <form className="w-full sm:w-80" method="get">
              <input
                name="q"
                defaultValue={query}
                placeholder="Search title, category, status..."
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
              />
            </form>
            <Link
              href="/documents/new"
              className="inline-flex shrink-0 items-center justify-center rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              New Document
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {documents.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="max-w-[220px] truncate px-4 py-3 font-medium text-neutral-900" title={row.document_title ?? undefined}>
                      <Link href={`/documents/${row.id}`} className="hover:underline">
                        {row.document_title ?? "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.document_category ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.document_type ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.employee_id ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.document_status ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.expiry_date ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!documents.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">
              {query ? "No documents match your search." : "No documents found."}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
