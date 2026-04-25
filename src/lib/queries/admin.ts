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
  password_reset_required?: boolean;
  password?: string;
  confirm_password?: string;
};

export type UpdateAdminUserInput = Omit
  CreateAdminUserInput,
  "password" | "confirm_password"
> & {
  new_password?: string;
  confirm_new_password?: string;
};

export type AssignUserRoleInput = {
  user_id?: string;
  role_id?: string;
};

type UserProfileRow = {
  id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone_number: string | null;
  role_id: string | null;
  account_status: string | null;
  is_active: boolean | null;
  password_reset_required: boolean | null;
  created_at: string | null;
};

const USER_PROFILE_SELECT = `
  id,
  full_name,
  first_name,
  last_name,
  email,
  phone_number,
  role_id,
  account_status,
  is_active,
  password_reset_required,
  created_at
`;

function toNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed : null;
}

function buildFullName(firstName?: string | null, lastName?: string | null): string | null {
  const fullName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  return fullName || null;
}

function validatePasswordPair(password?: string, confirmPassword?: string): string {
  const nextPassword = password ?? "";
  const nextConfirmPassword = confirmPassword ?? "";

  if (!nextPassword || !nextConfirmPassword) {
    throw new Error("Password and confirm password are required.");
  }
  if (nextPassword.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }
  if (nextPassword !== nextConfirmPassword) {
    throw new Error("Password and confirm password must match.");
  }

  return nextPassword;
}

function validateOptionalPasswordPair(
  password?: string,
  confirmPassword?: string
): string | null {
  const nextPassword = password ?? "";
  const nextConfirmPassword = confirmPassword ?? "";

  if (!nextPassword && !nextConfirmPassword) return null;
  if (!nextPassword || !nextConfirmPassword) {
    throw new Error("New password and confirm new password must both be filled.");
  }
  if (nextPassword.length < 8) {
    throw new Error("New password must be at least 8 characters.");
  }
  if (nextPassword !== nextConfirmPassword) {
    throw new Error("New password and confirm new password must match.");
  }

  return nextPassword;
}

async function enrichUsersWithRoles(
  users: UserProfileRow[]
): Promise<AdminUserRecord[]> {
  const supabase = createAdminClient();
  const roleIds = [
    ...new Set(
      users
        .map((user) => user.role_id)
        .filter((roleId): roleId is string => Boolean(roleId))
    ),
  ];

  const roleMap = new Map<string, { role_name: string | null; role_code: string | null }>();

  if (roleIds.length) {
    const { data: roles, error } = await supabase
      .from("roles")
      .select("id, role_name, role_code")
      .in("id", roleIds);

    if (error) {
      throw new Error(`Failed to load user roles: ${error.message}`);
    }

    for (const role of roles ?? []) {
      roleMap.set(role.id, {
        role_name: role.role_name,
        role_code: role.role_code,
      });
    }
  }

  return users.map((user) => {
    const role = user.role_id ? roleMap.get(user.role_id) : undefined;

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
      last_login_at: null,
      password_reset_required: user.password_reset_required,
      failed_login_attempts: null,
      locked_at: null,
      deactivated_at: null,
      created_at: user.created_at,
    };
  });
}

export async function listUsers(): Promise<AdminUserRecord[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select(USER_PROFILE_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listUsers error:", JSON.stringify(error, null, 2));
    throw new Error(`Failed to load users: ${error.message}`);
  }

  return enrichUsersWithRoles((data ?? []) as UserProfileRow[]);
}

export async function getAdminUserById(
  id: string
): Promise<AdminUserRecord | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("user_profiles")
    .select(USER_PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load user profile: ${error.message}`);
  }

  if (!data) return null;
  const [user] = await enrichUsersWithRoles([data as UserProfileRow]);
  return user ?? null;
}

export async function listRoles(): Promise<AdminRoleRecord[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("roles")
    .select(
      "id, role_name, role_code, description, is_system_role, is_active, created_at"
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
  input?: CreateAdminUserInput
): Promise<AdminUserRecord> {
  return createAdminUser(input);
}

export async function createAdminUser(
  input?: CreateAdminUserInput
): Promise<AdminUserRecord> {
  const email = toNull(input?.email);
  const firstName = toNull(input?.first_name);
  const lastName = toNull(input?.last_name);
  const fullName = buildFullName(firstName, lastName);
  const password = validatePasswordPair(input?.password, input?.confirm_password);

  if (!email) {
    throw new Error("Email is required.");
  }

  const adminSupabase = createAdminClient();
  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
      },
    });

  if (authError || !authData.user) {
    throw new Error(
      `Failed to create Supabase Auth user: ${
        authError?.message ?? "Auth user was not returned."
      }`
    );
  }

  const { data, error } = await adminSupabase
    .from("user_profiles")
    .upsert({
      id: authData.user.id,
      full_name: fullName,
      first_name: firstName,
      last_name: lastName,
      email,
      phone_number: toNull(input?.phone_number),
      role_id: toNull(input?.role_id),
      account_status: toNull(input?.account_status) ?? "Active",
      is_active: input?.is_active ?? true,
      password_reset_required: input?.password_reset_required ?? false,
    })
    .select(USER_PROFILE_SELECT)
    .single();

  if (error) {
    await adminSupabase.auth.admin.deleteUser(authData.user.id);
    throw new Error(`Failed to create user profile: ${error.message}`);
  }

  const [user] = await enrichUsersWithRoles([data as UserProfileRow]);
  return user;
}

export async function updateAdminUser(
  id: string,
  input: UpdateAdminUserInput
): Promise<AdminUserRecord> {
  const newPassword = validateOptionalPasswordPair(
    input.new_password,
    input.confirm_new_password
  );

  const adminSupabase = createAdminClient();

  if (newPassword) {
    const { error: passwordError } = await adminSupabase.auth.admin.updateUserById(
      id,
      { password: newPassword }
    );

    if (passwordError) {
      throw new Error(`Failed to update Supabase Auth password: ${passwordError.message}`);
    }
  }

  const firstName = toNull(input.first_name);
  const lastName = toNull(input.last_name);

  const { data, error } = await adminSupabase
    .from("user_profiles")
    .update({
      full_name: buildFullName(firstName, lastName),
      first_name: firstName,
      last_name: lastName,
      email: toNull(input.email),
      phone_number: toNull(input.phone_number),
      role_id: toNull(input.role_id),
      account_status: toNull(input.account_status),
      is_active: input.is_active ?? false,
      password_reset_required: input.password_reset_required ?? false,
    })
    .eq("id", id)
    .select(USER_PROFILE_SELECT)
    .single();

  if (error) {
    throw new Error(`Failed to update user profile: ${error.message}`);
  }

  const [user] = await enrichUsersWithRoles([data as UserProfileRow]);
  return user;
}

export async function assignUserRole(
  _input?: AssignUserRoleInput
): Promise<{ success: true }> {
  return { success: true };
}