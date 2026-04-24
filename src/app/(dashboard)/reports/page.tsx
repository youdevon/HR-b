import Link from "next/link";

const reportLinks = [
  { href: "/reports/employees", label: "Employees" },
  { href: "/reports/contracts", label: "Contracts" },
  { href: "/reports/documents", label: "Documents" },
  { href: "/reports/files", label: "Files" },
  { href: "/reports/leave", label: "Leave" },
  { href: "/reports/compensation", label: "Compensation" },
  { href: "/reports/gratuity", label: "Gratuity" },
  { href: "/reports/audit", label: "Audit" },
  { href: "/reports/users", label: "Users" },
] as const;

export default function Page() {
  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Reports</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Browse HR reporting areas. Detailed exports and filters will be added here.
        </p>
      </div>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">Report categories</h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {reportLinks.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className="block rounded-xl border border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-800 transition hover:border-neutral-300 hover:bg-neutral-50"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
