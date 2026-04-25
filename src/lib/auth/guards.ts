import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  getCurrentUserPermissions,
  getCurrentUserProfile,
  type CurrentUserProfile,
} from "@/lib/auth/permissions";
import { getCurrentUser, getUser } from "@/lib/auth/session";
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
  const user = await getCurrentUser();

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
  const user = await getCurrentUser();

  if (user) {
    redirect(redirectTo);
  }
}

export async function optionalUser() {
  return getCurrentUser();
}

export type DashboardAuthContext = {
  user: User;
  profile: CurrentUserProfile | null;
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
  const [profile, permissions] = await Promise.all([
    getCurrentUserProfile(),
    getCurrentUserPermissions(),
  ]);
  return { user, profile, permissions };
}

export async function requireDashboardAuth(
  options: { redirectTo?: string } = {}
): Promise<DashboardAuthContext> {
  const { redirectTo = "/login" } = options;
  const ctx = await loadDashboardAuthContext();
  if (!ctx) {
    redirect(redirectTo);
  }
  return ctx;
}
