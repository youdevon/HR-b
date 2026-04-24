import {
  assignUserRole,
  createUser,
  listLoginActivity,
  listRoles,
  listUsers,
  resetUserPassword,
  setUserActive,
} from "@/lib/queries/admin";
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
      await createUser({
        full_name: String(formData.get("full_name") ?? ""),
        first_name: String(formData.get("first_name") ?? ""),
        last_name: String(formData.get("last_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone_number: String(formData.get("phone_number") ?? ""),
        role_id: String(formData.get("role_id") ?? ""),
        account_status: "Active",
        is_active: true,
      });
      revalidatePath("/admin/users");
      redirectWithMessage("success", "User created successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user.";
      redirectWithMessage("error", errorMessage);
    }
  }

  async function assignRoleAction(formData: FormData) {
    "use server";
    try {
      const userId = String(formData.get("user_id") ?? "");
      const roleId = String(formData.get("role_id") ?? "");
      await assignUserRole(userId, roleId);
      revalidatePath("/admin/users");
      redirectWithMessage("success", "Role updated.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update role.";
      redirectWithMessage("error", errorMessage);
    }
  }

  async function setActiveAction(formData: FormData) {
    "use server";
    try {
      const userId = String(formData.get("user_id") ?? "");
      const isActive = String(formData.get("is_active") ?? "") === "true";
      await setUserActive(userId, isActive);
      revalidatePath("/admin/users");
      redirectWithMessage("success", isActive ? "Account enabled." : "Account disabled.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update account status.";
      redirectWithMessage("error", errorMessage);
    }
  }

  async function resetPasswordAction(formData: FormData) {
    "use server";
    try {
      const email = String(formData.get("email") ?? "");
      const link = await resetUserPassword(email);
      revalidatePath("/admin/users");
      redirectWithMessage("success", `Password reset link: ${link}`);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to reset password.";
      redirectWithMessage("error", errorMessage);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Create users, assign roles, disable accounts, reset passwords, and review login activity.
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
          <h2 className="text-lg font-semibold text-neutral-900">Create User</h2>
          <form action={createUserAction} className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input name="full_name" placeholder="Full name" required className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="first_name" placeholder="First name" required className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="last_name" placeholder="Last name" required className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="email" type="email" placeholder="Email" required className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <input name="phone_number" placeholder="Phone (optional)" className="rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            <select name="role_id" required className="rounded-xl border border-neutral-300 px-3 py-2 text-sm">
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            <div className="md:col-span-2 lg:col-span-2 flex items-center">
              <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                Create User
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Users</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Last Login</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-neutral-100">
                  <td className="p-2 font-medium text-neutral-900">{user.full_name}</td>
                  <td className="p-2 text-neutral-700">{user.email}</td>
                  <td className="p-2">
                    <form action={assignRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="user_id" value={user.id} />
                      <select
                        name="role_id"
                        defaultValue={user.role_id}
                        className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                      >
                        {roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.name}
                          </option>
                        ))}
                      </select>
                      <button type="submit" className="rounded-lg border border-neutral-300 px-2 py-1 text-xs">
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="p-2">{user.is_active ? "Active" : "Disabled"}</td>
                  <td className="p-2">{formatDate(user.last_sign_in_at)}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-2">
                      <form action={setActiveAction}>
                        <input type="hidden" name="user_id" value={user.id} />
                        <input type="hidden" name="is_active" value={user.is_active ? "false" : "true"} />
                        <button
                          type="submit"
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                        >
                          {user.is_active ? "Disable" : "Enable"}
                        </button>
                      </form>
                      <form action={resetPasswordAction}>
                        <input type="hidden" name="email" value={user.email} />
                        <button
                          type="submit"
                          className="rounded-lg border border-neutral-300 px-2 py-1 text-xs"
                        >
                          Reset Password
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Login Activity</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="p-2 text-left">User</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Last Sign-in</th>
              </tr>
            </thead>
            <tbody>
              {loginActivity.map((entry) => (
                <tr key={entry.user_id} className="border-t border-neutral-100">
                  <td className="p-2 font-medium text-neutral-900">{entry.full_name}</td>
                  <td className="p-2 text-neutral-700">{entry.email}</td>
                  <td className="p-2">{entry.role_id}</td>
                  <td className="p-2">{formatDate(entry.last_sign_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}
