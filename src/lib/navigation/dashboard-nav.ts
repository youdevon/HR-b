import type { CurrentUserProfile } from "@/lib/auth/permissions";
import { isSuperUser } from "@/lib/auth/permissions";

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
  href: string;
  permissions: string[];
  icon: DashboardNavIconName;
};

export const DASHBOARD_NAV_DEFS: DashboardNavItemDef[] = [
  { label: "Dashboard", shortLabel: "Db", href: "/dashboard", permissions: ["dashboard.view"], icon: "layoutDashboard" },
  { label: "Employees", shortLabel: "Em", href: "/employees", permissions: ["employees.view"], icon: "users" },
  { label: "Contracts", shortLabel: "Co", href: "/contracts", permissions: ["contracts.view"], icon: "fileText" },
  { label: "Leave", shortLabel: "Lv", href: "/leave", permissions: ["leave.view"], icon: "calendar" },
  { label: "Documents", shortLabel: "Do", href: "/documents", permissions: ["documents.view"], icon: "folderOpen" },
  { label: "Physical Files", shortLabel: "PF", href: "/file-movements", permissions: ["employee.file.view", "employee.file.move"], icon: "fileStack" },
  { label: "Compensation", shortLabel: "Cp", href: "/compensation/current", permissions: ["compensation.view"], icon: "dollarSign" },
  { label: "Gratuity", shortLabel: "Gr", href: "/gratuity/calculations", permissions: ["gratuity.view"], icon: "landmark" },
  { label: "Alerts", shortLabel: "Al", href: "/alerts/active", permissions: ["alerts.view"], icon: "bell" },
  { label: "Reports", shortLabel: "Re", href: "/reports", permissions: ["reports.view"], icon: "barChart2" },
  { label: "Audit Trail", shortLabel: "Au", href: "/audit/activity", permissions: ["audit.view"], icon: "listTree" },
  {
    label: "Admin Settings",
    shortLabel: "AS",
    href: "/admin",
    permissions: [
      "admin.users.manage",
      "admin.roles.manage",
      "admin.permissions.manage",
      "admin.settings.manage",
    ],
    icon: "settings2",
  },
];

export type SerializedNavItem = {
  label: string;
  shortLabel: string;
  href: string;
  icon: DashboardNavIconName;
};

export function filterDashboardNavItems(
  profile: CurrentUserProfile | null,
  permissions: string[],
  defs: DashboardNavItemDef[] = DASHBOARD_NAV_DEFS
): SerializedNavItem[] {
  const superUser = isSuperUser(profile);
  return defs
    .filter(
      (item) =>
        superUser || permissions.includes("*") || item.permissions.some((p) => permissions.includes(p))
    )
    .map(({ label, shortLabel, href, icon }) => ({ label, shortLabel, href, icon }));
}
