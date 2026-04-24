import Link from "next/link";
import { listExpiredDocuments } from "@/lib/queries/documents";

export default async function ExpiredDocumentsPage() {
  const documents = await listExpiredDocuments();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Expired Documents</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Documents whose expiry date is before today (non-null expiry dates only).
          </p>
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Expired on</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {documents.map((item) => (
                  <tr key={item.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/documents/${item.id}`} className="hover:underline">
                        {item.document_title ?? "-"}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{item.employee_id ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{item.document_category ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3">{item.expiry_date ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!documents.length ? (
            <div className="px-4 py-10 text-center text-sm text-neutral-600">No expired documents found.</div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
