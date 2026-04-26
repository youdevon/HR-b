import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ACTIVE_NAV_PERMISSION_KEYS,
  fetchPermissionsForProfile,
  fetchUserProfileForAuthUser,
  getCurrentUserPermissions,
  getCurrentUserProfile,
  hasAnyPermissionForContext,
  hasOnlyProfilePermissions,
  hasPermissionForContext,
  isOfficer,
  isProfileActive,
  isSuperUser,
  type CurrentUserProfile,
} from "@/lib/auth/permissions";
import { AUTH_RATE_LIMIT_MESSAGE, getUser, isSupabaseAuthRateLimitError } from "@/lib/auth/session";
import { RECORD_KEEPING_UI_ENABLED } from "@/lib/features/record-keeping-ui";
export {
  requireAnyPermission,
  hasAnyPermissionForContext,
  hasPermissionForContext,
  requirePermission,
} from "@/lib/auth/permissions";

type RequireUserOptions = {
  redirectTo?: string;
};

export async function requireUser(options: RequireUserOptions = {}): Promise<User> {
  const { redirectTo = "/login" } = options;
  const user = await getUser();

  if (!user) {
    redirect(redirectTo);
  }

  return user;
}

type RequireGuestOptions = {
  redirectTo?: string;
};

export async function requireGuest(options: RequireGuestOptions = {}): Promise<void> {
  const { redirectTo = "/" } = options;
  const user = await getUser();

  if (user) {
    redirect(redirectTo);
  }
}

export async function optionalUser() {
  return getUser();
}

export type DashboardAuthContext = {
  user: User;
  profile: CurrentUserProfile | null;
  role: string | null;
  permissions: string[];
};

/**
 * Resolves the session with one `getUser` (see `getUser` / `getCurrentUser` in `session.ts`) and
 * primes the cached `getCurrentUserProfile` / `getCurrentUserPermissions` for the same request,
 * so deeper server components reusing those helpers do not issue duplicate fetches.
 */
export async function loadDashboardAuthContext(): Promise<DashboardAuthContext | null> {
  let user: User | null = null;
  try {
    user = await getUser();
  } catch (error) {
    if (isSupabaseAuthRateLimitError(error)) {
      throw new Error(AUTH_RATE_LIMIT_MESSAGE);
    }
    throw error;
  }
  if (!user) return null;

  // Build auth context from the already-resolved user to avoid another auth lookup path.
  const profile = await fetchUserProfileForAuthUser(user);
  if (!isProfileActive(profile)) return null;
  const role = profile?.role_code ?? profile?.role_name ?? null;
  const permissions = await fetchPermissionsForProfile(profile).catch((error: unknown) => {
    console.error(
      "getDashboardSession permission lookup error:",
      error instanceof Error ? error.message : String(error)
    );
    // No retries in this request path.
    return [];
  });

  return { user, profile, role, permissions };
}

/**
 * Single dashboard auth/session resolver per request.
 * Returns user, profile, role, and permissions for layout-level composition.
 */
export const getDashboardSession = cache(async (): Promise<DashboardAuthContext | null> => {
  return loadDashboardAuthContext();
});

export function isAuthRateLimitError(error: unknown): boolean {
  if (error instanceof Error && error.message === AUTH_RATE_LIMIT_MESSAGE) return true;
  return isSupabaseAuthRateLimitError(error);
}

export function canViewNavItem(
  profile: CurrentUserProfile | null,
  permissions: string[],
  navKey: keyof typeof ACTIVE_NAV_PERMISSION_KEYS
): boolean {
  return hasAnyPermissionForContext(profile, permissions, [
    ...ACTIVE_NAV_PERMISSION_KEYS[navKey],
  ]);
}

/**
 * Returns true when a user should be confined to the self-service profile area.
 * Officer users with only profile.* permissions get profile-only routing.
 * SUPER_USER is never treated as profile-only.
 */
export function isProfileOnlyUser(
  profile: CurrentUserProfile | null,
  permissions: string[]
): boolean {
  if (isSuperUser(profile)) return false;
  if (!isOfficer(profile)) return false;
  return hasOnlyProfilePermissions(profile, permissions);
}

/**
 * Determines the landing page for a user after login.
 * - OFFICER → /profile (unless explicitly granted HR module permissions)
 * - SUPER_USER / ADMIN / INTAKE_CLERK → /dashboard
 * - Unknown role → first accessible module based on permissions
 */
export function getFirstAccessibleModuleHref(
  profile: CurrentUserProfile | null,
  permissions: string[]
): string | null {
  if (isProfileOnlyUser(profile, permissions)) return "/profile";

  const roleCode = (profile?.role_code ?? "").toUpperCase();
  if (roleCode === "OFFICER" && !hasAnyPermissionForContext(profile, permissions, [...ACTIVE_NAV_PERMISSION_KEYS.dashboard])) {
    return "/profile";
  }
  if (roleCode === "SUPER_USER" || roleCode === "ADMIN" || roleCode === "INTAKE" || roleCode === "INTAKE_CLERK") {
    if (hasAnyPermissionForContext(profile, permissions, [...ACTIVE_NAV_PERMISSION_KEYS.dashboard])) {
      return "/dashboard";
    }
  }

  const candidates: Array<{ key: keyof typeof ACTIVE_NAV_PERMISSION_KEYS; href: string }> = [
    { key: "dashboard", href: "/dashboard" },
    { key: "profile", href: "/profile" },
    { key: "employees", href: "/employees" },
    { key: "contracts", href: "/contracts" },
    { key: "leave", href: "/leave" },
    { key: "physicalFiles", href: "/file-movements" },
    { key: "records", href: "/records" },
    { key: "reports", href: "/reports" },
    { key: "audit", href: "/audit/activity" },
    { key: "gratuity", href: "/gratuity/calculations" },
    { key: "settings", href: "/settings" },
  ];

  const ordered = RECORD_KEEPING_UI_ENABLED ? candidates : candidates.filter((c) => c.key !== "records");

  for (const candidate of ordered) {
    if (canViewNavItem(profile, permissions, candidate.key)) return candidate.href;
  }
  return null;
}

export async function requireDashboardAuth(
  options: { redirectTo?: string } = {}
): Promise<DashboardAuthContext> {
  const { redirectTo = "/login" } = options;
  const ctx = await getDashboardSession();
  if (!ctx) {
    redirect(redirectTo);
  }
  return ctx;
}

export async function assertPermission(permissionKey: string): Promise<void> {
  const [profile, permissions] = await Promise.all([
    getCurrentUserProfile(),
    getCurrentUserPermissions(),
  ]);
  if (!hasPermissionForContext(profile, permissions, permissionKey)) {
    throw new Error("Access denied. You do not have permission to perform this action.");
  }
}

export async function assertAnyPermission(permissionKeys: string[]): Promise<void> {
  const [profile, permissions] = await Promise.all([
    getCurrentUserProfile(),
    getCurrentUserPermissions(),
  ]);
  if (!hasAnyPermissionForContext(profile, permissions, permissionKeys)) {
    throw new Error("Access denied. You do not have permission to perform this action.");
  }
}
