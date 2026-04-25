import { createClient } from "@/lib/supabase/server";
import {
  getCurrentUserProfile,
  profileDisplayName,
} from "@/lib/auth/permissions";

export type AuthenticatedUserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  role_id: string | null;
  role_name: string | null;
  role_code: string | null;
};

export async function getAuthenticatedUserProfile(): Promise<AuthenticatedUserProfile | null> {
  const profile = await getCurrentUserProfile();
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    full_name: profileDisplayName(profile),
    first_name: profile.first_name,
    last_name: profile.last_name,
    role_id: profile.role_id,
    role_name: profile.role_name,
    role_code: profile.role_code,
  };
}

export async function changePasswordWithCurrentPassword({
  currentPassword,
  newPassword,
  confirmPassword,
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
  if (newPassword.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { ok: false, message: "New password and confirm password must match." };
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