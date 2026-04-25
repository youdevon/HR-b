import PageHeader from "@/components/layout/page-header";
import { requireAnyPermission } from "@/lib/auth/guards";
import { listPermissions, type AdminPermissionRecord } from "@/lib/queries/admin";

const ACTIVE_MODULES = new Set([
  "dashboard",
  "employees",
  "contracts",
  "leave",
  "physical files",
  "records",
  "alerts",
  "reports",
  "audit",
  "gratuity",
  "admin users",
  "admin roles",
  "admin permissions",
  "administration",
  "settings",
]);

const INACTIVE_MODULES = new Set(["documents", "compensation"]);

function groupedPermissions(permissions: AdminPermissionRecord[]) {
  return permissions.reduce<{
    active: Record<string, AdminPermissionRecord[]>;
    inactive: Record<string, AdminPermissionRecord[]>;
  }>(
    (acc, permission) => {
      const moduleName = permission.module_name?.trim() || "General";
      const normalized = moduleName.toLowerCase();
      if (INACTIVE_MODULES.has(normalized)) {
        acc.inactive[moduleName] = [...(acc.inactive[moduleName] ?? []), permission];
        return acc;
      }
      if (!ACTIVE_MODULES.has(normalized)) return acc;
      acc.active[moduleName] = [...(acc.active[moduleName] ?? []), permission];
      return acc;
    },
    { active: {}, inactive: {} }
  );
}

export default async function AdminPermissionsPage() {
  await requireAnyPermission(["admin.permissions.view", "admin.permissions.manage"]);
  const permissions = await listPermissions();
  const grouped = groupedPermissions(permissions);

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Permissions"
        description="Review available system permissions."
        backHref="/settings"
      />
      {Object.keys(grouped.active).length ? (
        <section className="grid gap-4 lg:grid-cols-2">
          {Object.entries(grouped.active).map(([moduleName, modulePermissions]) => (
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
      {Object.keys(grouped.inactive).length ? (
        <section className="space-y-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
          <h2 className="text-base font-semibold text-neutral-700">Inactive / Not Currently Used</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.entries(grouped.inactive).map(([moduleName, modulePermissions]) => (
              <article key={moduleName} className="rounded-2xl border border-neutral-200 bg-neutral-100 p-5 opacity-80">
                <h3 className="text-lg font-semibold text-neutral-700">{moduleName}</h3>
                <div className="mt-4 space-y-3">
                  {modulePermissions.map((permission) => (
                    <div key={permission.id} className="rounded-xl border border-neutral-200 bg-white p-3">
                      <p className="font-medium text-neutral-800">
                        {permission.permission_name ?? permission.permission_key}
                      </p>
                      <p className="mt-1 font-mono text-xs text-neutral-500">
                        {permission.permission_key}
                      </p>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
    </main>
  );
}
