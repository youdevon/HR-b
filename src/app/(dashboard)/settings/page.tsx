import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { getDashboardSession, requireAnyPermission } from "@/lib/auth/guards";
import { hasAnyPermissionForContext } from "@/lib/auth/permissions";

type SettingsCard = {
  title: string;
  description: string;
  href?: string;
  enabled: boolean;
};

export default async function SettingsLandingPage() {
  await requireAnyPermission([
    "admin.users.view",
    "admin.users.manage",
    "admin.roles.view",
    "admin.roles.manage",
    "admin.permissions.view",
    "admin.permissions.manage",
    "gratuity.rules.manage",
    "admin.settings.manage",
    "settings.manage",
  ]);

  const auth = await getDashboardSession();
  const profile = auth?.profile ?? null;
  const permissions = auth?.permissions ?? [];

  const canUsers = hasAnyPermissionForContext(profile, permissions, ["admin.users.view", "admin.users.manage"]);
  const canRoles = hasAnyPermissionForContext(profile, permissions, ["admin.roles.view", "admin.roles.manage"]);
  const canPermissions = hasAnyPermissionForContext(profile, permissions, ["admin.permissions.view", "admin.permissions.manage"]);
  const canGratuityRules = hasAnyPermissionForContext(profile, permissions, ["gratuity.rules.manage"]);
  const canSystemSettings = hasAnyPermissionForContext(profile, permissions, ["admin.settings.manage", "settings.manage"]);

  const cards: SettingsCard[] = [
    {
      title: "Users",
      description: "Manage user accounts, roles, and account access state.",
      href: "/admin/users",
      enabled: canUsers,
    },
    {
      title: "Roles",
      description: "Manage role definitions and permission assignments.",
      href: "/admin/roles",
      enabled: canRoles,
    },
    {
      title: "Permissions",
      description: "Review available system permissions by module.",
      href: "/admin/permissions",
      enabled: canPermissions,
    },
    {
      title: "Gratuity Rules",
      description: "Manage global gratuity calculation rates used across the system.",
      href: "/settings/gratuity-rules",
      enabled: canGratuityRules,
    },
    {
      title: "System Settings",
      description: "System-wide configuration and operational defaults.",
      enabled: canSystemSettings,
    },
  ];

  const visibleCards = cards.filter((card) => card.enabled);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage users, roles, permissions, gratuity rules, and system configuration."
        backHref="/dashboard"
      />

      {visibleCards.length ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCards.map((card) => {
            if (card.title === "System Settings") {
              return (
                <article
                  key={card.title}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-semibold text-neutral-900">{card.title}</h2>
                    <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                      Coming Soon
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-neutral-600">{card.description}</p>
                </article>
              );
            }

            return (
              <Link
                key={card.title}
                href={card.href ?? "#"}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:bg-neutral-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-base font-semibold text-neutral-900">{card.title}</h2>
                  <span className="text-sm text-neutral-500">→</span>
                </div>
                <p className="mt-2 text-sm text-neutral-600">{card.description}</p>
              </Link>
            );
          })}
        </section>
      ) : (
        <section className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-600 shadow-sm">
          No settings sections are currently available for your role.
        </section>
      )}
    </main>
  );
}
