import { createAdminClient } from "@/lib/supabase/admin";

export type AdminUserRecord = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  role_id: string | null;
  role_name: string | null;
  role_code: string | null;
  account_status: string | null;
  is_active: boolean | null;
  last_login_at: string | null;
  password_reset_required: boolean | null;
  failed_login_attempts: number | null;
  locked_at: string | null;
  deactivated_at: string | null;
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

export type LoginActivityRecord = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  activity_type: string | null;
  ip_address: string | null;
  created_at: string | null;
};

export type CreateAdminUserInput = {
  full_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  role_id?: string;
  account_status?: string;
  is_active?: boolean;
};

export type AssignUserRoleInput = {
  user_id?: string;
  role_id?: string;
};

export async function listUsers(): Promise<AdminUserRecord[]> {
  const supabase = createAdminClient();

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select(
      `
      id,
      full_name,
      first_name,
      last_name,
      email,
      phone_number,
      role_id,
      account_status,
      is_active,
      last_login_at,
      password_reset_required,
      failed_login_attempts,
      locked_at,
      deactivated_at,
      created_at
    `
    )
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("listUsers usersError:", JSON.stringify(usersError, null, 2));
    throw new Error(`Failed to load users: ${usersError.message}`);
  }

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("id, role_name, role_code");

  if (rolesError) {
    console.error("listUsers rolesError:", JSON.stringify(rolesError, null, 2));
    throw new Error(`Failed to load user roles: ${rolesError.message}`);
  }

  const roleMap = new Map(
    (roles ?? []).map((role) => [
      role.id,
      {
        role_name: role.role_name,
        role_code: role.role_code,
      },
    ])
  );

  return (users ?? []).map((user) => {
    const role = user.role_id ? roleMap.get(user.role_id) : null;

    return {
      id: user.id,
      full_name: user.full_name,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      role_id: user.role_id,
      role_name: role?.role_name ?? null,
      role_code: role?.role_code ?? null,
      account_status: user.account_status,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      password_reset_required: user.password_reset_required,
      failed_login_attempts: user.failed_login_attempts,
      locked_at: user.locked_at,
      deactivated_at: user.deactivated_at,
      created_at: user.created_at,
    };
  });
}

export async function listRoles(): Promise<AdminRoleRecord[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("roles")
    .select(
      `
      id,
      role_name,
      role_code,
      description,
      is_system_role,
      is_active,
      created_at
    `
    )
    .order("role_name", { ascending: true });

  if (error) {
    console.error("listRoles error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load roles: ${error.message}`);
  }

  return data ?? [];
}

export async function listLoginActivity(): Promise<LoginActivityRecord[]> {
  return [];
}

export async function createUser(
  _input?: CreateAdminUserInput
): Promise<{ success: true }> {
  return { success: true };
}

export async function createAdminUser(
  _input?: CreateAdminUserInput
): Promise<{ success: true }> {
  return { success: true };
}

export async function assignUserRole(
  _input?: AssignUserRoleInput
): Promise<{ success: true }> {
  return { success: true };
}