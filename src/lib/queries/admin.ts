import { createClient } from "@/lib/supabase/server";

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

function toNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
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
  if (!firstName || !lastName) throw new Error("First name and last name are required.");
  if (!email) throw new Error("Email is required.");
  if (!roleId) throw new Error("Role is required.");

  const supabase = await createClient();
  const { data, error } = await supabase.from("user_profiles").insert({ first_name: firstName, last_name: lastName, email, phone_number: toNull(input?.phone_number), role_id: roleId, account_status: toNull(input?.account_status) ?? "Active" }).select(USER_PROFILE_SELECT).single();
  if (error) throw new Error(`Failed to create user profile: ${error.message}`);
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

  const supabase = await createClient();
  const { data, error } = await supabase.from("user_profiles").update({ first_name: firstName, last_name: lastName, email, phone_number: toNull(input.phone_number), role_id: toNull(input.role_id), account_status: toNull(input.account_status) ?? "Active" }).eq("id", id).select(USER_PROFILE_SELECT).single();
  if (error) throw new Error(`Failed to update user profile: ${error.message}`);
  const [user] = await enrichUsersWithRoles([data as UserProfileRow]);
  return user;
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
