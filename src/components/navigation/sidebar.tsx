import Link from "next/link";

type Role = "SUPER_USER" | "ADMIN" | "OFFICER" | "INTAKE";

type NavItem = {
  label: string;
  href: string;
  roles: Role[];
};

const currentRole: Role = "ADMIN";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: ["SUPER_USER", "ADMIN", "OFFICER", "INTAKE"] },
  { label: "Employees", href: "/employees", roles: ["SUPER_USER", "ADMIN", "OFFICER", "INTAKE"] },
  { label: "Contracts", href: "/contracts", roles: ["SUPER_USER", "ADMIN", "OFFICER", "INTAKE"] },
  { label: "Leave", href: "/leave/balances", roles: ["SUPER_USER", "ADMIN", "OFFICER"] },
  { label: "Compensation", href: "/compensation/current", roles: ["SUPER_USER", "ADMIN", "OFFICER"] },
  { label: "Gratuity", href: "/gratuity/calculations", roles: ["SUPER_USER", "ADMIN", "OFFICER"] },
  { label: "Documents", href: "/documents", roles: ["SUPER_USER", "ADMIN", "OFFICER", "INTAKE"] },
  { label: "Records", href: "/records", roles: ["SUPER_USER", "ADMIN", "OFFICER", "INTAKE"] },
  { label: "Physical Files", href: "/files/movements", roles: ["SUPER_USER", "ADMIN", "OFFICER"] },
  { label: "Alerts", href: "/alerts/active", roles: ["SUPER_USER", "ADMIN", "OFFICER"] },
  { label: "Reports", href: "/reports", roles: ["SUPER_USER", "ADMIN", "OFFICER"] },
  { label: "Audit Trail", href: "/audit/activity", roles: ["SUPER_USER", "ADMIN", "OFFICER"] },
  { label: "Administration", href: "/admin/users", roles: ["SUPER_USER", "ADMIN"] },
];

export default function Sidebar() {
  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-neutral-200 px-6 py-5">
        <div className="text-lg font-semibold tracking-tight">HR System</div>
        <p className="mt-1 text-sm text-neutral-500">Internal management portal</p>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-xl px-3 py-2 text-sm font-medium text-neutral-700 transition hover:bg-neutral-100 hover:text-neutral-900"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <div className="rounded-2xl bg-neutral-50 p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">Current role</p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">{currentRole}</p>
        </div>
      </div>
    </div>
  );
}