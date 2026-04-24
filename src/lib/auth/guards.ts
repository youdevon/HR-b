import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth/session";

type RequireUserOptions = {
  redirectTo?: string;
};

export async function requireUser(
  options: RequireUserOptions = {}
): Promise<User> {
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

export async function requireGuest(
  options: RequireGuestOptions = {}
): Promise<void> {
  const { redirectTo = "/dashboard" } = options;
  const user = await getCurrentUser();

  if (user) {
    redirect(redirectTo);
  }
}

export async function optionalUser() {
  return getCurrentUser();
}