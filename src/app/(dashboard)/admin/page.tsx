import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { requireAnyPermission } from "@/lib/auth/guards";
import {
  getCurrentUserPermissions,
  getCurrentUserProfile,
  isSuperUser,
} from "@/lib/auth/permissions";

const adminSections = [
  {
    href: "/admin/users",
    title: "Admin Users",
    description: "Manage application users, roles, and account status.",
    permissions: ["admin.users.manage"],
  },
  {
    href: "/admin/roles",
    title: "Admin Roles",
    description: "Review system roles and role codes used for access control.",
    permissions: ["admin.roles.manage"],
  },
  {
    href: "/admin/permissions",
    title: "Admin Permissions",
    description: "Review permission settings and access-related configuration.",
    permissions: ["admin.permissions.manage"],
  },
  {
    href: "/admin/document-types",
    title: "Document Types",
    description: "Manage document type settings for HR document tracking.",
    permissions: ["admin.settings.manage"],
  },
  {
    href: "/admin/custom-fields",
    title: "Custom Fields",
    description: "Configure custom fields used across HR records.",
    permissions: ["admin.settings.manage"],
  },
  {
    href: "/admin/settings",
    title: "System Settings",
    description: "Access general administration and system configuration options.",
    permissions: ["admin.settings.manage"],
  },
] as const;

export default async function AdminPage() {
  await requireAnyPermission([
    "admin.users.manage",
    "admin.roles.manage",
    "admin.permissions.manage",
    "admin.settings.manage",
  ]);
  const profile = await getCurrentUserProfile().catch(() => null);
  const permissions: string[] = await getCurrentUserPermissions().catch(() => []);
  const superUser = isSuperUser(profile) || permissions.includes("*");
  const visibleSections = adminSections.filter(
    (section) =>
      superUser ||
      section.permissions.some((permission) => permissions.includes(permission))
  );

  return (
    <main className="space-y-6">
      <PageHeader
        title="Admin Settings"
        description="Manage users, access, and system configuration."
        backHref="/dashboard"
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visibleSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
          >
            <h2 className="text-sm font-semibold text-neutral-900">{section.title}</h2>
            <p className="mt-2 text-sm text-neutral-600">{section.description}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
