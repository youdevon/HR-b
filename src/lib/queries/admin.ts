export type AdminUserRecord = {
  id: string;
  full_name: string | null;
  email: string | null;
  role_name: string | null;
  account_status: string | null;
  created_at: string | null;
};

export type AdminRoleRecord = {
  id: string;
  role_name: string | null;
  role_code: string | null;
  description: string | null;
};

export type LoginActivityRecord = {
  id: string;
  user_email: string | null;
  activity_type: string | null;
  created_at: string | null;
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

export async function createUser(): Promise<{ success: true }> {
  return { success: true };
}

export async function assignUserRole(): Promise<{ success: true }> {
  return { success: true };
}