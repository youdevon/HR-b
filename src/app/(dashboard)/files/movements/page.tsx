"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type MovementRow = {
  id: string;
  file_number: string;
  employee_id: string;
  from_department: string;
  to_department: string;
  movement_status: string;
  date_sent: string;
};

const mockMovements: MovementRow[] = [
  { id: "mov_1", file_number: "FILE-1001", employee_id: "emp_001", from_department: "HR", to_department: "Finance", movement_status: "received", date_sent: "2026-04-01" },
  { id: "mov_2", file_number: "FILE-1002", employee_id: "emp_002", from_department: "HR", to_department: "Operations", movement_status: "in_transit", date_sent: "2026-04-18" },
  { id: "mov_3", file_number: "FILE-1003", employee_id: "emp_003", from_department: "HR", to_department: "Legal", movement_status: "missing", date_sent: "2026-03-10" },
];

export default function FileMovementsPage() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return mockMovements;
    return mockMovements.filter((row) =>
      [row.file_number, row.employee_id, row.from_department, row.to_department, row.movement_status, row.date_sent]
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
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">File Movements</h1>
            <p className="mt-1 text-sm text-neutral-600">Search physical file transfer records.</p>
          </div>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search file number, status..."
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 sm:w-80"
          />
        </section>
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-neutral-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-neutral-600">
                  <th className="px-4 py-3">File #</th><th className="px-4 py-3">Employee</th><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white text-sm text-neutral-700">
                {filtered.map((row) => (
                  <tr key={row.id} className="transition hover:bg-neutral-50">
                    <td className="px-4 py-3 font-medium text-neutral-900"><Link href={`/files/${row.id}`} className="hover:underline">{row.file_number}</Link></td>
                    <td className="px-4 py-3">{row.employee_id}</td>
                    <td className="px-4 py-3">{row.from_department}</td>
                    <td className="px-4 py-3">{row.to_department}</td>
                    <td className="px-4 py-3">{row.movement_status}</td>
                    <td className="px-4 py-3">{row.date_sent}</td>
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
