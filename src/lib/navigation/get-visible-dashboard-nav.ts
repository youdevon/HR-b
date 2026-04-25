import type { CurrentUserProfile } from "@/lib/auth/permissions";
import { filterDashboardNavItems, type SerializedNavItem } from "./dashboard-nav";

/**
 * Build nav items from profile/permissions already loaded in the dashboard layout
 * (single auth path). Do not call Supabase from here.
 */
export function buildVisibleDashboardNavItems(
  profile: CurrentUserProfile | null,
  permissions: string[]
): SerializedNavItem[] {
  return filterDashboardNavItems(profile, permissions);
}
