"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { MobileNavDrawer } from "@/components/drawers/mobile-nav-drawer";
import { DesktopDashboardSidebar, SIDEBAR_STORAGE_KEY } from "@/components/navigation/sidebar-nav";
import TopbarClient, { type TopbarUserProps } from "@/components/navigation/topbar";
import type { SerializedNavItem } from "@/lib/navigation/dashboard-nav";
import { cn } from "@/lib/utils/cn";

type AppShellProps = {
  children: ReactNode;
  navItems: SerializedNavItem[];
  currentYear: number;
  topbarUser: TopbarUserProps;
};

export default function AppShell({ children, navItems, currentYear, topbarUser }: AppShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [sidebarHydrated, setSidebarHydrated] = useState(false);

  useEffect(() => {
    setSidebarHydrated(true);
    try {
      const v = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (v === "1" || v === "true") setDesktopCollapsed(true);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const toggleDesktopCollapse = useCallback(() => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  return (
    <div className="h-screen overflow-hidden bg-neutral-100 text-neutral-900">
      <div className="flex h-full min-w-0">
        <aside
          className={cn(
            "hidden h-screen shrink-0 border-r border-neutral-200 bg-white transition-[width] duration-200 ease-out lg:flex",
            (sidebarHydrated ? desktopCollapsed : false) ? "w-[4.5rem]" : "w-72",
          )}
        >
          <div className="h-full w-full min-w-0">
            <DesktopDashboardSidebar
              items={navItems}
              collapsed={sidebarHydrated ? desktopCollapsed : false}
              onToggleCollapse={toggleDesktopCollapse}
              currentYear={currentYear}
            />
          </div>
        </aside>

        <MobileNavDrawer
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          items={navItems}
          currentYear={currentYear}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <TopbarClient user={topbarUser} onOpenMobileNav={() => setMobileOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
        </div>
      </div>
    </div>
  );
}
