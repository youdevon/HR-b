import {
  listLoginActivity,
  listUsers,
  type AdminUserRecord,
  type LoginActivityRecord,
} from "@/lib/queries/admin";
import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";

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

function displayFullName(user: AdminUserRecord): string {
  const fullName = `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim();
  return fullName || "—";
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const sp = await searchParams;
  await requirePermission("admin.users.view");
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const [users, loginActivity] = await Promise.all([
    listUsers(),
    listLoginActivity(),
  ]);

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Users"
          description="Manage system user accounts and access."
          backHref="/settings"
          actions={
            <Link
              href="/admin/users/new"
              className="inline-flex w-fit rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              New User
            </Link>
          }
        />

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

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 overflow-x-auto">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">Users</h2>
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="p-2 text-left">Full name</th>
                <th className="p-2 text-left">Email</th>
                <th className="p-2 text-left">Role</th>
                <th className="p-2 text-left">Account Status</th>
                <th className="p-2 text-left">Edit</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map((user: AdminUserRecord) => (
                  <tr key={user.id} className="border-t border-neutral-100">
                    <td className="p-2 font-medium text-neutral-900">
                      {displayFullName(user)}
                    </td>
                    <td className="p-2 text-neutral-700">{user.email ?? "—"}</td>
                    <td className="p-2">
                      {user.role_name || user.role_code ? (
                        <span className="font-medium text-neutral-900">
                          {user.role_name ?? user.role_code}
                        </span>
                      ) : (
                        <span className="text-neutral-400">Unassigned</span>
                      )}
                    </td>
                    <td className="p-2">
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                        {user.account_status ?? "Unknown"}
                      </span>
                    </td>
                    <td className="p-2">
                      <Link
                        href={`/admin/users/${user.id}/edit`}
                        className="text-sm font-medium text-neutral-900 underline-offset-2 hover:underline"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-sm text-neutral-500">
                    No users found in <code>public.user_profiles</code>.
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
                loginActivity.map((entry: LoginActivityRecord) => (
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