import { userSchema, type User, type UserInput } from "@/lib/validators/user";

export type UserRecord = User & { id: string; created_at: string; updated_at: string };

const mockUsers: UserRecord[] = [
  {
    id: "usr_1",
    full_name: "Ayesha Khan",
    first_name: "Ayesha",
    last_name: "Khan",
    email: "ayesha.khan@company.com",
    phone_number: "+971501111111",
    role_id: "ADMIN",
    account_status: "Active",
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export async function listUsers(): Promise<UserRecord[]> { return Promise.resolve(mockUsers); }
export async function createUser(input: UserInput): Promise<UserRecord> {
  const parsed = userSchema.parse(input);
  const now = new Date().toISOString();
  return Promise.resolve({ id: `usr_${Date.now()}`, ...parsed, created_at: now, updated_at: now });
}
export async function listRoles(): Promise<{ id: string; name: string; description: string }[]> {
  return Promise.resolve([
    { id: "SUPER_USER", name: "Super User", description: "Full system access" },
    { id: "ADMIN", name: "Admin", description: "Administrative access" },
    { id: "OFFICER", name: "Officer", description: "Operational access" },
  ]);
}
export async function listPermissions(): Promise<{ key: string; description: string; role_count: number }[]> {
  return Promise.resolve([
    { key: "employees.read", description: "Read employee records", role_count: 4 },
    { key: "contracts.write", description: "Manage contract records", role_count: 3 },
  ]);
}
export async function listDocumentTypes(): Promise<{ id: string; name: string; category: string }[]> {
  return Promise.resolve([
    { id: "dt_1", name: "Employment Agreement", category: "Contract" },
    { id: "dt_2", name: "Passport Copy", category: "Employee" },
  ]);
}
export async function listCustomFields(): Promise<{ id: string; module: string; field_name: string; field_type: string }[]> {
  return Promise.resolve([
    { id: "cf_1", module: "employees", field_name: "nationality", field_type: "text" },
    { id: "cf_2", module: "contracts", field_name: "union_code", field_type: "text" },
  ]);
}
