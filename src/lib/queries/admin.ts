export type AdminUserRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_name: string | null;
  role_code: string | null;
  account_status: string | null;
  created_at: string | null;
  is_active: boolean | null;
};

export type AdminRoleRecord = {
  id: string;
  role_name: string | null;
  role_code: string | null;
  description: string | null;
  created_at: string | null;
};

export type LoginActivityRecord = {
  id: string;
  user_email: string | null;
  activity_type: string | null;
  created_at: string | null;
};

export type CreateAdminUserInput = {
  full_name?: string;
  email?: string;
  role_id?: string;
  account_status?: string;
  is_active?: boolean;
};

export type AssignUserRoleInput = {
  user_id?: string;
  role_id?: string;
};

export async function listUsers(): Promise<AdminUserRecord[]> {
  return [];
}

export async function listRoles(): Promise<AdminRoleRecord[]> {
  return [];
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