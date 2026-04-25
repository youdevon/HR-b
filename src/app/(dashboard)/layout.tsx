import type { ReactNode } from "react";
import AppShell from "@/components/layout/app-shell";
import { requireDashboardAuth } from "@/lib/auth/guards";
import { profileDisplayName } from "@/lib/auth/permissions";
import { buildVisibleDashboardNavItems } from "@/lib/navigation/get-visible-dashboard-nav";

type DashboardLayoutProps = {
  children: ReactNode;
};

function getInitials(name: string): string {
  if (!name.trim()) return "G";
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "G"
  );
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const auth = await requireDashboardAuth({ redirectTo: "/login" });
  const navItems = buildVisibleDashboardNavItems(auth.profile, auth.permissions);
  const displayName = auth.profile ? profileDisplayName(auth.profile) : "Guest";
  const currentYear = new Date().getFullYear();

  return (
    <AppShell
      navItems={navItems}
      currentYear={currentYear}
      topbarUser={{
        displayName,
        email: auth.profile?.email ?? auth.user.email ?? "Not signed in",
        roleKey: auth.profile?.role_code ?? auth.profile?.role_name,
        initials: getInitials(displayName),
      }}
    >
      {children}
    </AppShell>
  );
}
