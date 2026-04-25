/**
 * Dashboard shell navigation is built in `layout` from a single session load
 * (`requireDashboardAuth`) and passed as `navItems` into `AppShell`. This module
 * exports the builder for reuse and the serialized item type.
 */
export { buildVisibleDashboardNavItems } from "@/lib/navigation/get-visible-dashboard-nav";
export type { SerializedNavItem } from "@/lib/navigation/dashboard-nav";
