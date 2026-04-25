import Link from "next/link";
import PageHeader from "@/components/layout/page-header";
import { listRoles } from "@/lib/queries/admin";
import { requirePermission } from "@/lib/auth/guards";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default async function AdminRolesPage() {
  await requirePermission("admin.roles.view");
  const roles = await listRoles();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <PageHeader
          title="Roles"
          description="Roles loaded from public.roles."
          backHref="/dashboard"
          actions={
            <>
              <span className="inline-flex h-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                {roles.length} total
              </span>
              <Link href="/admin/roles/new" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                New Role
              </Link>
            </>
          }
        />
        <section className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="p-2 text-left">Role Name</th>
                <th className="p-2 text-left">Role Code</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Active</th>
                <th className="p-2 text-left">System</th>
                <th className="p-2 text-left">Created At</th>
                <th className="p-2 text-left">Edit</th>
              </tr>
            </thead>
            <tbody>
              {roles.length ? (
                roles.map((role) => (
                  <tr key={role.id} className="border-t border-neutral-100">
                    <td className="p-2 font-medium text-neutral-900">{role.role_name ?? "—"}</td>
                    <td className="p-2 font-mono text-xs text-neutral-700">{role.role_code ?? "—"}</td>
                    <td className="p-2 text-neutral-700">{role.description ?? "—"}</td>
                    <td className="p-2 text-neutral-700">{role.is_active === false ? "No" : "Yes"}</td>
                    <td className="p-2 text-neutral-700">{role.is_system_role ? "Yes" : "No"}</td>
                    <td className="p-2 text-neutral-700">{formatDate(role.created_at)}</td>
                    <td className="p-2">
                      <Link href={`/admin/roles/${role.id}/edit`} className="font-medium text-neutral-900 hover:underline">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-sm text-neutral-500">
                    No roles found in <code>public.roles</code>. Add role seed data to enable assignment
                    in admin user creation.
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
