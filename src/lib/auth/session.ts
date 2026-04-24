import { cache } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

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
    console.error(`Failed to load user: ${error.message}`);
    return null;
  }

  return user ?? null;
});

export const getCurrentUser = cache(async (): Promise<User | null> => {
  return getUser();
});

export async function isAuthenticated(): Promise<boolean> {
  const user = await getCurrentUser();
  return Boolean(user);
}