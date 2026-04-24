import { createClient } from "@/lib/supabase/server";

export type AuthenticatedUserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
};

export async function getAuthenticatedUserProfile(): Promise<AuthenticatedUserProfile | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return {
    id: user.id,
    email: user.email ?? null,
    full_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email ||
      "User",
  };
}