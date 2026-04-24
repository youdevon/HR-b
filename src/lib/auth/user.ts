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

export async function changePasswordWithCurrentPassword({
  currentPassword,
  newPassword,
}: {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
}): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { ok: false, message: "No authenticated user found." };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    return { ok: false, message: "Current password is incorrect." };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  return { ok: true, message: "Password updated successfully." };
}