import { cache } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const AUTH_RATE_LIMIT_MESSAGE =
  "Authentication is temporarily rate-limited. Please wait a moment and refresh.";

export function isSupabaseAuthRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  if (!("message" in error)) return false;
  const message = String((error as { message?: unknown }).message ?? "").toLowerCase();
  return message.includes("rate limit") || message.includes("too many requests");
}

/**
 * `getUser` / `getCurrentUser` are request-scoped via React `cache()`.
 * Dashboard routes should use `getDashboardSession` from guards once and pass
 * profile/permissions as props to avoid extra `getUser` calls in the same request.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error(`Failed to load session: ${error.message}`);
    return null;
  }

  return session ?? null;
});

export const getUser = cache(async (): Promise<User | null> => {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    if (isSupabaseAuthRateLimitError(error)) {
      throw new Error(AUTH_RATE_LIMIT_MESSAGE);
    }
    console.error(`Failed to load user: ${error.message}`);
    return null;
  }

  return user ?? null;
});

export const getCurrentUser = getUser;

/**
 * Returns auth user id quickly for server-side permission-aware query branches.
 * This avoids pulling full profile details in places that only need identity.
 */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const user = await getCurrentUser();
  return user?.id ?? null;
});

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user);
}