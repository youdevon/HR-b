import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  fetchPermissionsForProfile,
  fetchUserProfileForAuthUser,
  type CurrentUserProfile,
} from "@/lib/auth/permissions";
import { getUser } from "@/lib/auth/session";
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
  const { redirectTo = "/dashboard" } = options;
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
  const user = await getUser();
  if (!user) return null;

  // Build auth context from the already-resolved user to avoid another auth lookup path.
  const profile = await fetchUserProfileForAuthUser(user);
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
