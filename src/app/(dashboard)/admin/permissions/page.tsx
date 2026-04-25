import PageHeader from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { listPermissions, type AdminPermissionRecord } from "@/lib/queries/admin";

function groupedPermissions(permissions: AdminPermissionRecord[]) {
  return permissions.reduce<Record<string, AdminPermissionRecord[]>>((acc, permission) => {
    const moduleName = permission.module_name ?? "General";
    const normalized = moduleName.trim().toLowerCase();
    if (normalized === "documents" || normalized === "compensation") {
      return acc;
    }
    acc[moduleName] = [...(acc[moduleName] ?? []), permission];
    return acc;
  }, {});
}

export default async function AdminPermissionsPage() {
  await requirePermission("admin.roles.manage");
  const permissions = await listPermissions();
  const grouped = groupedPermissions(permissions);

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Permissions"
        description="Permissions from public.permissions, grouped by module."
        backHref="/dashboard"
      />
      {Object.keys(grouped).length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {Object.entries(grouped).map(([moduleName, modulePermissions]) => (
            <article key={moduleName} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
              <h2 className="text-lg font-semibold text-neutral-900">{moduleName}</h2>
              <div className="mt-4 space-y-3">
                {modulePermissions.map((permission) => (
                  <div key={permission.id} className="rounded-xl border border-neutral-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900">
                          {permission.permission_name ?? permission.permission_key}
                        </p>
                        <p className="mt-1 font-mono text-xs text-neutral-500">
                          {permission.permission_key}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-700">
                          {permission.is_active === false ? "Inactive" : "Active"}
                        </span>
                        {permission.is_sensitive ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                            Sensitive
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-neutral-500">
                      Type: {permission.permission_type ?? "—"}
                    </p>
                    <p className="mt-2 text-sm text-neutral-600">{permission.description ?? "—"}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500 shadow-sm ring-1 ring-neutral-200">
          No permissions found in <code>public.permissions</code>.
        </section>
      )}
    </div>
    </main>
  );
}
