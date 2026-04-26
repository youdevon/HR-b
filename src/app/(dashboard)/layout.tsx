import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import AppShell from "@/components/layout/app-shell";
import { dashboardMainInnerClass } from "@/lib/ui/dashboard-styles";
import {
  type DashboardAuthContext,
  getDashboardSession,
  getFirstAccessibleModuleHref,
  isAuthRateLimitError,
  isProfileOnlyUser,
} from "@/lib/auth/guards";
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
  let auth: DashboardAuthContext | null = null;
  try {
    auth = await getDashboardSession();
  } catch (error) {
    if (isAuthRateLimitError(error)) {
      return (
        <main className="mx-auto max-w-3xl p-6">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900 shadow-sm">
            <h1 className="text-lg font-semibold">Please wait and try again</h1>
            <p className="mt-2 text-sm">
              Authentication is temporarily rate-limited. Refresh this page in a moment.
            </p>
          </section>
        </main>
      );
    }
    throw error;
  }

  if (!auth) {
    redirect("/login");
  }

  const profileOnly = isProfileOnlyUser(auth.profile, auth.permissions);
  const navItems = buildVisibleDashboardNavItems(auth.profile, auth.permissions);

  if (!navItems.length) {
    if (profileOnly) {
      redirect("/profile");
    }
    const fallback = getFirstAccessibleModuleHref(auth.profile, auth.permissions);
    redirect(fallback ?? "/access-denied");
  }

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
      <div className={dashboardMainInnerClass}>{children}</div>
    </AppShell>
  );
}
