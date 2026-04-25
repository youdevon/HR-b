import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/queries/audit";

export type AdminUserRecord = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  role_id: string | null;
  role_name: string | null;
  role_code: string | null;
  account_status: string | null;
  created_at: string | null;
};

export type AdminRoleRecord = {
  id: string;
  role_name: string | null;
  role_code: string | null;
  description: string | null;
  is_system_role: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
};

export type AdminPermissionRecord = {
  id: string;
  module_name: string | null;
  permission_key: string | null;
  permission_name: string | null;
  permission_type: string | null;
  description: string | null;
  is_sensitive: boolean | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

export type LoginActivityRecord = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  activity_type: string | null;
  ip_address: string | null;
  created_at: string | null;
};

export type CreateAdminUserInput = {
  first_name?: string;
  last_name?: string;
  email?: string;
  password?: string;
  phone_number?: string;
  role_id?: string;
  account_status?: string;
};

export type UpdateAdminUserInput = CreateAdminUserInput;

export type RoleInput = {
  role_name?: string;
  role_code?: string;
  description?: string;
  is_active?: boolean;
};

type UserProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  role_id: string | null;
  account_status: string | null;
  created_at: string | null;
};

const USER_PROFILE_SELECT = "id, first_name, last_name, email, phone_number, role_id, account_status, created_at";
const ROLE_SELECT = "id, role_name, role_code, description, is_system_role, is_active, created_at";
const PERMISSION_SELECT = "id, permission_key, permission_name, module_name, permission_type, description, is_sensitive, is_active, created_at, updated_at";
const ACTIVE_ROLE_PERMISSION_MODULES = new Set([
  "dashboard",
  "employees",
  "contracts",
  "leave",
  "physical files",
  "records",
  "alerts",
  "reports",
  "audit",
  "gratuity",
  "administration",
  "settings",
]);

function toNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function accountStatusToIsActive(status: string): boolean {
  return status.trim().toLowerCase() === "active";
}

export function normalizeRoleCode(value: string | undefined): string {
  return (value ?? "")
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toUpperCase();
}

async function enrichUsersWithRoles(users: UserProfileRow[]): Promise<AdminUserRecord[]> {
  const supabase = await createClient();
  const roleIds = [...new Set(users.map((user) => user.role_id).filter((id): id is string => Boolean(id)))];
  const roleMap = new Map<string, { role_name: string | null; role_code: string | null }>();

  if (roleIds.length) {
    const { data, error } = await supabase.from("roles").select("id, role_name, role_code").in("id", roleIds);
    if (error) throw new Error(`Failed to load user roles: ${error.message}`);
    for (const role of data ?? []) roleMap.set(role.id, { role_name: role.role_name, role_code: role.role_code });
  }

  return users.map((user) => {
    const role = user.role_id ? roleMap.get(user.role_id) : undefined;
    return { ...user, role_name: role?.role_name ?? null, role_code: role?.role_code ?? null };
  });
}

export async function listUsers(): Promise<AdminUserRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_profiles").select(USER_PROFILE_SELECT).order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load users: ${error.message}`);
  return enrichUsersWithRoles((data ?? []) as UserProfileRow[]);
}

export async function getAdminUserById(id: string): Promise<AdminUserRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_profiles").select(USER_PROFILE_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load user profile: ${error.message}`);
  if (!data) return null;
  const [user] = await enrichUsersWithRoles([data as UserProfileRow]);
  return user ?? null;
}

export async function listRoles(): Promise<AdminRoleRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").select(ROLE_SELECT).order("role_name", { ascending: true });
  if (error) throw new Error(`Failed to load roles: ${error.message}`);
  return data ?? [];
}

export async function getRoleById(id: string): Promise<AdminRoleRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").select(ROLE_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`Failed to load role: ${error.message}`);
  return data ?? null;
}

export async function listPermissions(): Promise<AdminPermissionRecord[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("permissions").select(PERMISSION_SELECT).order("module_name", { ascending: true }).order("permission_key", { ascending: true });
  if (error) throw new Error(`Failed to load permissions: ${error.message}`);
  return data ?? [];
}

export async function listAssignablePermissions(): Promise<AdminPermissionRecord[]> {
  const permissions = await listPermissions();
  return permissions.filter((permission) => {
    const moduleName = permission.module_name?.trim().toLowerCase();
    if (!moduleName) return false;
    if (permission.is_active === false) return false;
    return ACTIVE_ROLE_PERMISSION_MODULES.has(moduleName);
  });
}

export async function listRolePermissionIds(roleId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("role_permissions").select("permission_id").eq("role_id", roleId);
  if (error) throw new Error(`Failed to load role permissions: ${error.message}`);
  return (data ?? []).map((row) => row.permission_id as string | null).filter((permissionId): permissionId is string => Boolean(permissionId));
}

export async function createAdminUser(input?: CreateAdminUserInput): Promise<AdminUserRecord> {
  const firstName = toNull(input?.first_name);
  const lastName = toNull(input?.last_name);
  const email = toNull(input?.email);
  const roleId = toNull(input?.role_id);
  const password = input?.password ?? "";
  if (!firstName || !lastName) throw new Error("First name and last name are required.");
  if (!email) throw new Error("Email is required.");
  if (!roleId) throw new Error("Role is required.");
  if (password.length < 8) throw new Error("Password must be at least 8 characters.");
  const accountStatus = toNull(input?.account_status) ?? "Active";
  const isActive = accountStatusToIsActive(accountStatus);
  const nowIso = new Date().toISOString();

  const adminClient = createAdminClient();
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    },
  });
  if (authError || !authData.user?.id) {
    throw new Error(`Failed to create auth user: ${authError?.message ?? "Auth user id not returned."}`);
  }
  const authUserId = authData.user.id;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .insert({
      id: authUserId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: toNull(input?.phone_number),
      role_id: roleId,
      account_status: accountStatus,
      is_active: isActive,
      created_at: nowIso,
      updated_at: nowIso,
    })
    .select(USER_PROFILE_SELECT)
    .single();
  if (error) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(authUserId);
    const rollbackHint = rollbackError
      ? ` Cleanup failed for auth user ${authUserId}: ${rollbackError.message}`
      : "";
    throw new Error(
      `Auth user created but failed to create user profile: ${error.message}.${rollbackHint}`
    );
  }
  const [user] = await enrichUsersWithRoles([data as UserProfileRow]);
  return user;
}

export const createUser = createAdminUser;

export async function updateAdminUser(id: string, input: UpdateAdminUserInput): Promise<AdminUserRecord> {
  const firstName = toNull(input.first_name);
  const lastName = toNull(input.last_name);
  const email = toNull(input.email);
  if (!firstName || !lastName) throw new Error("First name and last name are required.");
  if (!email) throw new Error("Email is required.");
  const accountStatus = toNull(input.account_status) ?? "Active";
  const isActive = accountStatusToIsActive(accountStatus);
  const nowIso = new Date().toISOString();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_profiles")
    .update({
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: toNull(input.phone_number),
      role_id: toNull(input.role_id),
      account_status: accountStatus,
      is_active: isActive,
      updated_at: nowIso,
    })
    .eq("id", id)
    .select(USER_PROFILE_SELECT)
    .single();
  if (error) throw new Error(`Failed to update user profile: ${error.message}`);
  const [user] = await enrichUsersWithRoles([data as UserProfileRow]);
  return user;
}

export async function updateAdminUserPassword(id: string, password: string): Promise<void> {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  const adminClient = createAdminClient();
  const { error } = await adminClient.auth.admin.updateUserById(id, { password });
  if (error) {
    throw new Error(`Failed to update user password: ${error.message}`);
  }
}

export async function userHasRecordedActivity(userId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("performed_by_user_id", userId)
    .limit(1);
  if (error) {
    throw new Error(`Failed to check user activity: ${error.message}`);
  }
  return (count ?? 0) > 0;
}

type DeletableUserSnapshot = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role_id: string | null;
  is_active: boolean | null;
  account_status: string | null;
};

async function loadDeletableUserSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<DeletableUserSnapshot> {
  const { data: targetUser, error: targetError } = await supabase
    .from("user_profiles")
    .select("id, first_name, last_name, email, role_id, is_active, account_status")
    .eq("id", userId)
    .maybeSingle();
  if (targetError) throw new Error(`Failed to load user account: ${targetError.message}`);
  if (!targetUser) throw new Error("User account not found.");
  return targetUser as DeletableUserSnapshot;
}

async function assertNotLastActiveSuperUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  targetUser: DeletableUserSnapshot
): Promise<void> {
  const targetRoleId = targetUser.role_id;
  if (!targetRoleId || targetUser.is_active !== true) return;

  const { data: targetRole, error: targetRoleError } = await supabase
    .from("roles")
    .select("id, role_code")
    .eq("id", targetRoleId)
    .maybeSingle();
  if (targetRoleError) throw new Error(`Failed to load user role: ${targetRoleError.message}`);
  const isTargetSuperUser = (targetRole?.role_code ?? "").toUpperCase() === "SUPER_USER";
  if (!isTargetSuperUser) return;

  const { data: superRoles, error: superRoleError } = await supabase
    .from("roles")
    .select("id")
    .eq("role_code", "SUPER_USER");
  if (superRoleError) {
    throw new Error(`Failed to validate Super User accounts: ${superRoleError.message}`);
  }
  const superRoleIds = (superRoles ?? []).map((row) => row.id as string);
  if (!superRoleIds.length) return;
  const { count: activeSuperCount, error: countError } = await supabase
    .from("user_profiles")
    .select("id", { count: "exact", head: true })
    .in("role_id", superRoleIds)
    .eq("is_active", true);
  if (countError) {
    throw new Error(`Failed to validate active Super User count: ${countError.message}`);
  }
  if ((activeSuperCount ?? 0) <= 1) {
    throw new Error("Cannot delete the last active Super User account.");
  }
}

async function deactivateUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  accountStatus: "deactivated" | "deleted"
): Promise<void> {
  const nowIso = new Date().toISOString();
  const supportsDeactivatedAt =
    !(await supabase.from("user_profiles").select("deactivated_at").limit(1)).error;
  const profilePatch: Record<string, unknown> = {
    is_active: false,
    account_status: accountStatus,
    updated_at: nowIso,
  };
  if (supportsDeactivatedAt) {
    profilePatch.deactivated_at = nowIso;
  }
  const { error } = await supabase
    .from("user_profiles")
    .update(profilePatch)
    .eq("id", userId);
  if (error) {
    throw new Error(`Failed to deactivate user profile: ${error.message}`);
  }
}

export async function deactivateAdminUserAccount(
  userId: string,
  currentUserId: string
): Promise<void> {
  if (!userId.trim()) throw new Error("User id is required.");
  if (!currentUserId.trim()) throw new Error("Current user id is required.");
  if (userId === currentUserId) {
    throw new Error("You cannot delete your own user account.");
  }
  const supabase = await createClient();
  const targetUser = await loadDeletableUserSnapshot(supabase, userId);
  await assertNotLastActiveSuperUser(supabase, targetUser);
  await deactivateUserProfile(supabase, userId, "deactivated");

  try {
    await writeAuditLog({
      module_name: "Admin",
      entity_type: "user_profile",
      entity_id: userId,
      action_type: "deactivate_user",
      action_summary: "Deactivated user account",
      old_values: {
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        email: targetUser.email,
        role_id: targetUser.role_id,
        is_active: targetUser.is_active,
        account_status: targetUser.account_status,
      },
      new_values: {
        is_active: false,
        account_status: "deactivated",
      },
      performed_by_user_id: currentUserId,
    });
  } catch (auditError) {
    console.error("deactivateAdminUserAccount audit error:", auditError);
  }
}

export async function deleteAdminUserAccount(
  userId: string,
  currentUserId: string
): Promise<void> {
  if (!userId.trim()) throw new Error("User id is required.");
  if (!currentUserId.trim()) throw new Error("Current user id is required.");
  if (userId === currentUserId) {
    throw new Error("You cannot delete your own user account.");
  }
  const supabase = await createClient();
  const targetUser = await loadDeletableUserSnapshot(supabase, userId);
  await assertNotLastActiveSuperUser(supabase, targetUser);

  if (await userHasRecordedActivity(userId)) {
    throw new Error(
      "This user account cannot be deleted because activity has already been recorded. You may deactivate the account instead."
    );
  }

  const adminClient = createAdminClient();
  const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
  if (authDeleteError) {
    throw new Error(`Failed to remove user login access: ${authDeleteError.message}`);
  }
  const { error: profileDeleteError } = await supabase
    .from("user_profiles")
    .delete()
    .eq("id", userId);
  if (profileDeleteError) {
    throw new Error(`User login removed but profile deletion failed: ${profileDeleteError.message}`);
  }

  try {
    await writeAuditLog({
      module_name: "Admin",
      entity_type: "user_profile",
      entity_id: userId,
      action_type: "delete_user",
      action_summary: "Deleted/deactivated user account",
      old_values: {
        first_name: targetUser.first_name,
        last_name: targetUser.last_name,
        email: targetUser.email,
        role_id: targetUser.role_id,
        is_active: targetUser.is_active,
        account_status: targetUser.account_status,
      },
      new_values: {
        is_active: null,
        account_status: "deleted",
      },
      performed_by_user_id: currentUserId,
    });
  } catch (auditError) {
    console.error("deleteAdminUserAccount audit error:", auditError);
  }
}

export async function createRole(input: RoleInput): Promise<AdminRoleRecord> {
  const roleName = toNull(input.role_name);
  const roleCode = normalizeRoleCode(input.role_code);
  if (!roleName) throw new Error("Role name is required.");
  if (!roleCode) throw new Error("Role code is required.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").insert({ role_name: roleName, role_code: roleCode, description: toNull(input.description), is_active: input.is_active ?? true }).select(ROLE_SELECT).single();
  if (error) throw new Error(`Failed to create role: ${error.message}`);
  return data;
}

export async function updateRole(id: string, input: RoleInput): Promise<AdminRoleRecord> {
  const roleName = toNull(input.role_name);
  const roleCode = normalizeRoleCode(input.role_code);
  if (!roleName) throw new Error("Role name is required.");
  if (!roleCode) throw new Error("Role code is required.");
  const supabase = await createClient();
  const { data, error } = await supabase.from("roles").update({ role_name: roleName, role_code: roleCode, description: toNull(input.description), is_active: input.is_active ?? true }).eq("id", id).select(ROLE_SELECT).single();
  if (error) throw new Error(`Failed to update role: ${error.message}`);
  return data;
}

export async function updateRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
  const supabase = await createClient();
  const { error: deleteError } = await supabase.from("role_permissions").delete().eq("role_id", roleId);
  if (deleteError) throw new Error(`Failed to clear role permissions: ${deleteError.message}`);
  const uniquePermissionIds = [...new Set(permissionIds)].filter(Boolean);
  if (!uniquePermissionIds.length) return;
  const { error: insertError } = await supabase.from("role_permissions").insert(uniquePermissionIds.map((permissionId) => ({ role_id: roleId, permission_id: permissionId })));
  if (insertError) throw new Error(`Failed to save role permissions: ${insertError.message}`);
}

export async function listLoginActivity(): Promise<LoginActivityRecord[]> {
  return [];
}
