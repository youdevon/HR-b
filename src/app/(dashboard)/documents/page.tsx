"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type DocumentRow = {
  id: string;
  document_title: string;
  document_category: string;
  document_type: string;
  employee_id: string;
  document_status: string;
  expiry_date: string;
};

const mockDocuments: DocumentRow[] = [
  {
    id: "doc_1",
    document_title: "Standard Employment Contract 2026",
    document_category: "Contract",
    document_type: "Employment Agreement",
    employee_id: "emp_001",
    document_status: "Active",
    expiry_date: "2027-12-31",
  },
  {
    id: "doc_2",
    document_title: "Passport Copy",
    document_category: "Employee",
    document_type: "Identification",
    employee_id: "emp_003",
    document_status: "Expiring",
    expiry_date: "2026-05-10",
  },
  {
    id: "doc_3",
    document_title: "Medical Certificate",
    document_category: "Leave",
    document_type: "Sick Leave Support",
    employee_id: "emp_002",
    document_status: "Expired",
    expiry_date: "2026-03-01",
  },
];

export default function DocumentsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return mockDocuments;
    return mockDocuments.filter((row) =>
      [row.document_title, row.document_category, row.document_type, row.employee_id, row.document_status, row.expiry_date]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Documents</h1>
            <p className="mt-1 text-sm text-neutral-600">Search and manage document records.</p>
          </div>
          <div className="flex w-full gap-3 sm:w-auto">
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search title, category, status..."
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 sm:w-80"
            />
            <Link href="/documents/new" className="shrink-0 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800">
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
                {filtered.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-neutral-900">
                      <Link href={`/documents/${row.id}`} className="hover:underline">{row.document_title}</Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">{row.document_category}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.document_type}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.employee_id}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.document_status}</td>
                    <td className="whitespace-nowrap px-4 py-3">{row.expiry_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
