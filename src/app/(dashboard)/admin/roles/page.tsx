import { listRoles } from "@/lib/queries/admin";

function formatDate(value: string | null): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

export default async function AdminRolesPage() {
  const roles = await listRoles();

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Roles</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Roles loaded from <code>public.roles</code>.
          </p>
        </section>
        <section className="overflow-x-auto rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="p-2 text-left">Role Name</th>
                <th className="p-2 text-left">Role Code</th>
                <th className="p-2 text-left">Description</th>
                <th className="p-2 text-left">Created At</th>
              </tr>
            </thead>
            <tbody>
              {roles.length ? (
                roles.map((role) => (
                  <tr key={role.id} className="border-t border-neutral-100">
                    <td className="p-2 font-medium text-neutral-900">{role.role_name ?? "—"}</td>
                    <td className="p-2 font-mono text-xs text-neutral-700">{role.role_code ?? "—"}</td>
                    <td className="p-2 text-neutral-700">{role.description ?? "—"}</td>
                    <td className="p-2 text-neutral-700">{formatDate(role.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-neutral-500">
                    No roles found in <code>public.roles</code>.
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
