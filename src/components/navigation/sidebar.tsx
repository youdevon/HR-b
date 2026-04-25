/**
 * Dashboard shell navigation is built in `layout` from a single session load
 * (`getDashboardSession`) and passed as `navItems` into `AppShell`. This module
 * exports the builder for reuse and the serialized item type. UI footer version
 * text is rendered by `sidebar-nav` via `APP_VERSION`.
 *
 * Visibility is strictly permission-driven and excludes inactive modules from
 * runtime nav composition.
 */
export { buildVisibleDashboardNavItems } from "@/lib/navigation/get-visible-dashboard-nav";
export type { SerializedNavItem } from "@/lib/navigation/dashboard-nav";
