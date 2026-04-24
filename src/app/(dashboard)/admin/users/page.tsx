import { createAdminUser, listLoginActivity, listRoles, listUsers } from "@/lib/queries/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type AdminUsersPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

function redirectWithMessage(status: "success" | "error", message: string): never {
  const qs = new URLSearchParams();
  qs.set("status", status);
  qs.set("message", message);
  redirect(`/admin/users?${qs.toString()}`);
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const sp = await searchParams;
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const [users, roles, loginActivity] = await Promise.all([
    listUsers(),
    listRoles(),
    listLoginActivity(),
  ]);

  async function createUserAction(formData: FormData) {
    "use server";
    try {
      await createAdminUser({
        full_name: String(formData.get("full_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        role_id: String(formData.get("role_id") ?? ""),
        account_status: String(formData.get("account_status") ?? "Active"),
        is_active: String(formData.get("is_active") ?? "") === "true",
      });
      revalidatePath("/admin/users");
      redirectWithMessage("success", "User created successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user.";
      redirectWithMessage("error", errorMessage);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Public user directory for HR/Admin with account state and login visibility.
          </p>
        </section>

        {message ? (
          <section
            className={`rounded-2xl border p-4 text-sm ${
              status === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message}
          </section>
        ) : null}

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Create User</h2>
          <form action={createUserAction} className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <input
              name="full_name"
              placeholder="Full name"
              required
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              required
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            />
            <select
              name="role_id"
              required
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name ?? role.role_code ?? "Role"}
                </option>
              ))}
            </select>
            <select
              name="account_status"
              defaultValue="Active"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Pending">Pending</option>
            </select>
            <select
              name="is_active"
              defaultValue="true"
              className="rounded-xl border border-neutral-300 px-3 py-2 text-sm"
            >
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
            <div className="lg:col-span-5">
              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Create User
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Users</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="p-2 text-left">Full Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Account Status</th>
                <th className="p-2 text-left">Active</th>
                <th className="p-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user) => (
                  <tr key={user.id} className="border-t border-neutral-100">
                    <td className="p-2 font-medium text-neutral-900">{user.full_name ?? "—"}</td>
                    <td className="p-2 text-neutral-700">{user.email ?? "—"}</td>
                    <td className="p-2">
                      {user.role_name ?? user.role_code ?? (
                        <span className="text-neutral-400">Unassigned</span>
                      )}
                    </td>
                    <td className="p-2">{user.account_status ?? "—"}</td>
                    <td className="p-2">
                      {user.is_active === null ? "—" : user.is_active ? "Yes" : "No"}
                    </td>
                    <td className="p-2">{formatDate(user.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-sm text-neutral-500">
                    No users found in <code>public.users</code>.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Login Activity</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="p-2 text-left">User ID</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Activity</th>
                <th className="p-2 text-left">IP Address</th>
                <th className="p-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {loginActivity.length ? (
                loginActivity.map((entry) => (
                  <tr key={entry.id} className="border-t border-neutral-100">
                    <td className="p-2 font-mono text-xs text-neutral-800">{entry.user_id ?? "—"}</td>
                    <td className="p-2 text-neutral-700">{entry.user_email ?? "—"}</td>
                    <td className="p-2">{entry.activity_type ?? "login"}</td>
                    <td className="p-2 font-mono text-xs text-neutral-700">{entry.ip_address ?? "—"}</td>
                    <td className="p-2">{formatDate(entry.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-sm text-neutral-500">
                    Login activity placeholder: no rows available yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
