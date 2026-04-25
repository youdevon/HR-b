import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export type CurrentUserProfile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  role_id: string | null;
  role_name: string | null;
  role_code: string | null;
  account_status: string | null;
};

type UserProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  role_id: string | null;
  account_status: string | null;
};

type RoleRow = {
  id: string;
  role_name: string | null;
  role_code: string | null;
};

type PermissionRow = {
  permission_key: string | null;
};

export function profileDisplayName(profile: CurrentUserProfile | null): string {
  const fullName = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return fullName || profile?.email || "User";
}

export function isSuperUser(profile: CurrentUserProfile | null): boolean {
  return (profile?.role_code ?? "").toUpperCase() === "SUPER_USER";
}

/** Profile for an already-resolved `User` (no additional `getUser` call). */
export async function fetchUserProfileForAuthUser(user: User): Promise<CurrentUserProfile | null> {
  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("id, first_name, last_name, email, phone_number, role_id, account_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    if (profileError) console.error("getCurrentUserProfile error:", profileError.message);
    return null;
  }

  const row = profile as UserProfileRow;
  let roleName: string | null = null;
  let roleCode: string | null = null;

  if (row.role_id) {
    const { data: role, error: roleError } = await supabase
      .from("roles")
      .select("id, role_name, role_code")
      .eq("id", row.role_id)
      .maybeSingle();

    if (roleError) {
      console.error("getCurrentUserProfile role error:", roleError.message);
    } else if (role) {
      const roleRow = role as RoleRow;
      roleName = roleRow.role_name;
      roleCode = roleRow.role_code;
    }
  }

  return {
    id: row.id,
    first_name: row.first_name,
    last_name: row.last_name,
    email: row.email ?? user.email ?? null,
    phone_number: row.phone_number,
    role_id: row.role_id,
    role_name: roleName,
    role_code: roleCode,
    account_status: row.account_status,
  };
}

/** Role permissions for a given profile (no `getUser` / `getCurrentUserProfile` calls). */
export async function fetchPermissionsForProfile(
  profile: CurrentUserProfile | null
): Promise<string[]> {
  if (!profile?.role_id) return [];
  if (isSuperUser(profile)) return ["*"];

  const supabase = await createClient();
  const { data: rolePermissions, error: rolePermissionsError } = await supabase
    .from("role_permissions")
    .select("permission_id")
    .eq("role_id", profile.role_id);

  if (rolePermissionsError) {
    console.error("getCurrentUserPermissions role_permissions error:", rolePermissionsError.message);
    return [];
  }

  const permissionIds = (rolePermissions ?? [])
    .map((row) => (row as { permission_id: string | null }).permission_id)
    .filter((permissionId): permissionId is string => Boolean(permissionId));

  if (!permissionIds.length) return [];

  const { data: permissions, error: permissionsError } = await supabase
    .from("permissions")
    .select("permission_key")
    .in("id", permissionIds)
    .eq("is_active", true);

  if (permissionsError) {
    console.error("getCurrentUserPermissions permissions error:", permissionsError.message);
    return [];
  }

  return [
    ...new Set(
      ((permissions ?? []) as PermissionRow[])
        .map((permission) => permission.permission_key)
        .filter((key): key is string => Boolean(key))
    ),
  ];
}

export const getCurrentUserProfile = cache(async (): Promise<CurrentUserProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  return fetchUserProfileForAuthUser(user);
});

export const getCurrentUserPermissions = cache(async (): Promise<string[]> => {
  return fetchPermissionsForProfile(await getCurrentUserProfile());
});

export function hasPermissionForContext(
  profile: CurrentUserProfile | null,
  permissions: string[],
  permissionKey: string
): boolean {
  if (isSuperUser(profile)) return true;
  return permissions.includes("*") || permissions.includes(permissionKey);
}

export function hasAnyPermissionForContext(
  profile: CurrentUserProfile | null,
  permissions: string[],
  permissionKeys: string[]
): boolean {
  if (isSuperUser(profile)) return true;
  if (permissions.includes("*")) return true;
  return permissionKeys.some((key) => permissions.includes(key));
}

export async function hasPermission(permissionKey: string): Promise<boolean> {
  const profile = await getCurrentUserProfile();
  const permissions = await getCurrentUserPermissions();
  return hasPermissionForContext(profile, permissions, permissionKey);
}

export async function requirePermission(permissionKey: string): Promise<void> {
  if (!(await hasPermission(permissionKey))) {
    redirect("/access-denied");
  }
}

export async function requireAnyPermission(permissionKeys: string[]): Promise<void> {
  const profile = await getCurrentUserProfile();
  const permissions = await getCurrentUserPermissions();
  if (hasAnyPermissionForContext(profile, permissions, permissionKeys)) return;
  redirect("/access-denied");
}
