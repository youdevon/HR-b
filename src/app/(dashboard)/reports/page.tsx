import Link from "next/link";
import PageHeader from "@/components/layout/page-header";

const reportLinks = [
  { href: "/reports/employees", label: "Employee Master List", description: "Employee identity, department, role, and status." },
  {
    href: "/reports/contracts",
    label: "Contract Reports",
    description: "View active, expiring, expired, fixed-term, and short-term contract reports.",
  },
  { href: "/reports/leave", label: "Leave Balances & Transactions", description: "Leave balances, requests, and status history." },
  { href: "/reports/files", label: "Physical File Movements", description: "Custody, status, and physical file movement activity." },
  { href: "/reports/audit", label: "Audit Activity", description: "System activity and sensitive changes." },
  { href: "/reports/users", label: "User Accounts", description: "Application users, roles, and account status." },
] as const;

export default function Page() {
  return (
    <main className="space-y-6">
      <PageHeader
        title="Reports"
        description="Browse operational HR reports with filters and export placeholders."
        backHref="/dashboard"
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {reportLinks.map(({ href, label, description }) => (
            <li key={href}>
              <Link
                href={href}
                className="block h-full rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
              >
                <h2 className="text-sm font-semibold text-neutral-900">{label}</h2>
                <p className="mt-2 text-sm text-neutral-600">{description}</p>
              </Link>
            </li>
          ))}
      </ul>
    </main>
  );
}
