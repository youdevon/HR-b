import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

type RequireUserOptions = {
  redirectTo?: string;
};

export async function requireUser(
  options: RequireUserOptions = {}
) {
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
) {
  const { redirectTo = "/dashboard" } = options;
  const user = await getCurrentUser();

  if (user) {
    redirect(redirectTo);
  }
}

export async function optionalUser() {
  return getCurrentUser();
}