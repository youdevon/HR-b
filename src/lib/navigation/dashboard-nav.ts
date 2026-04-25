import type { CurrentUserProfile } from "@/lib/auth/permissions";
import { ACTIVE_NAV_PERMISSION_KEYS, isSuperUser } from "@/lib/auth/permissions";

export type DashboardNavIconName =
  | "layoutDashboard"
  | "users"
  | "fileText"
  | "calendar"
  | "folderOpen"
  | "fileStack"
  | "dollarSign"
  | "landmark"
  | "bell"
  | "barChart2"
  | "listTree"
  | "settings2";

export type DashboardNavItemDef = {
  label: string;
  shortLabel: string;
  href?: string;
  active: boolean;
  permissions: string[];
  icon: DashboardNavIconName;
  children?: DashboardNavItemDef[];
};

export const DASHBOARD_NAV_DEFS: DashboardNavItemDef[] = [
  { label: "Dashboard", shortLabel: "Db", href: "/dashboard", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.dashboard], icon: "layoutDashboard" },
  { label: "Employees", shortLabel: "Em", href: "/employees", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.employees], icon: "users" },
  { label: "Contracts", shortLabel: "Co", href: "/contracts", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.contracts], icon: "fileText" },
  { label: "Leave", shortLabel: "Lv", href: "/leave", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.leave], icon: "calendar" },
  { label: "Physical Files", shortLabel: "PF", href: "/file-movements", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.physicalFiles], icon: "fileStack" },
  { label: "Records", shortLabel: "Rc", href: "/records", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.records], icon: "folderOpen" },
  { label: "Gratuity", shortLabel: "Gr", href: "/gratuity/calculations", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.gratuity], icon: "landmark" },
  { label: "Alerts", shortLabel: "Al", href: "/alerts/active", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.alerts], icon: "bell" },
  { label: "Reports", shortLabel: "Re", href: "/reports", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.reports], icon: "barChart2" },
  { label: "Audit", shortLabel: "Au", href: "/audit/activity", active: true, permissions: [...ACTIVE_NAV_PERMISSION_KEYS.audit], icon: "listTree" },
  {
    label: "Settings",
    shortLabel: "Se",
    href: "/settings",
    active: true,
    permissions: [...ACTIVE_NAV_PERMISSION_KEYS.settings],
    icon: "settings2",
  },
];

export type SerializedNavItem = {
  label: string;
  shortLabel: string;
  href?: string;
  icon: DashboardNavIconName;
  children?: SerializedNavItem[];
};

export function filterDashboardNavItems(
  profile: CurrentUserProfile | null,
  permissions: string[],
  defs: DashboardNavItemDef[] = DASHBOARD_NAV_DEFS
): SerializedNavItem[] {
  const superUser = isSuperUser(profile);
  const hasAccess = (item: DashboardNavItemDef): boolean =>
    item.active &&
    (superUser || permissions.includes("*") || item.permissions.some((p) => permissions.includes(p)));

  const toSerialized = (item: DashboardNavItemDef): SerializedNavItem | null => {
    if (item.children?.length) {
      const children = item.children
        .filter((child) => hasAccess(child))
        .map((child) => ({ label: child.label, shortLabel: child.shortLabel, href: child.href, icon: child.icon }));
      if (!children.length && !hasAccess(item)) return null;
      return { label: item.label, shortLabel: item.shortLabel, href: item.href, icon: item.icon, children };
    }
    if (!hasAccess(item)) return null;
    return { label: item.label, shortLabel: item.shortLabel, href: item.href, icon: item.icon };
  };

  return defs.map(toSerialized).filter((item): item is SerializedNavItem => Boolean(item));
}
