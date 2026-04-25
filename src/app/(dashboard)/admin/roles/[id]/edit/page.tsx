import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import {
  getRoleById,
  listPermissions,
  listRolePermissionIds,
  updateRole,
  updateRolePermissions,
  type AdminPermissionRecord,
} from "@/lib/queries/admin";
import { requirePermission } from "@/lib/auth/guards";

type EditRolePageProps = {
  params: Promise<{ id: string }>;
};

function groupedPermissions(permissions: AdminPermissionRecord[]) {
  return permissions.reduce<Record<string, AdminPermissionRecord[]>>((acc, permission) => {
    const moduleName = permission.module_name ?? "General";
    acc[moduleName] = [...(acc[moduleName] ?? []), permission];
    return acc;
  }, {});
}

export default async function EditRolePage({ params }: EditRolePageProps) {
  await requirePermission("admin.roles.manage");
  const { id } = await params;
  const [role, permissions, assignedPermissionIds] = await Promise.all([
    getRoleById(id),
    listPermissions(),
    listRolePermissionIds(id),
  ]);

  if (!role) notFound();

  async function saveRoleAction(formData: FormData) {
    "use server";
    const permissionIds = formData
      .getAll("permission_ids")
      .map((value) => String(value))
      .filter(Boolean);

    await updateRole(id, {
      role_name: String(formData.get("role_name") ?? ""),
      role_code: String(formData.get("role_code") ?? ""),
      description: String(formData.get("description") ?? ""),
      is_active: String(formData.get("is_active") ?? "true") === "true",
    });
    await updateRolePermissions(id, permissionIds);
    revalidatePath("/admin/roles");
    revalidatePath(`/admin/roles/${id}/edit`);
    redirect("/admin/roles");
  }

  const grouped = groupedPermissions(permissions);
  const assigned = new Set(assignedPermissionIds);

  return (
    <main className="space-y-6">
      <PageHeader
        title="Edit Role"
        description="Update role details and assigned permissions."
        backHref="/admin/roles"
      />

      <form action={saveRoleAction} className="space-y-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Role Name" name="role_name" defaultValue={role.role_name} required />
            <Field label="Role Code" name="role_code" defaultValue={role.role_code} required />
            <label className="space-y-2 md:col-span-2">
              <span className="text-sm font-medium text-neutral-700">Description</span>
              <textarea name="description" rows={4} defaultValue={role.description ?? ""} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-neutral-700">Active</span>
              <select name="is_active" defaultValue={role.is_active === false ? "false" : "true"} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm">
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </label>
            {role.is_system_role ? (
              <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
                This is a system role. Deletion is protected.
              </p>
            ) : null}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Permissions</h2>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {Object.entries(grouped).map(([moduleName, modulePermissions]) => (
              <div key={moduleName} className="rounded-2xl border border-neutral-200 p-4">
                <h3 className="font-semibold text-neutral-900">{moduleName}</h3>
                <div className="mt-3 space-y-2">
                  {modulePermissions.map((permission) => (
                    <label key={permission.id} className="flex gap-3 rounded-xl p-2 hover:bg-neutral-50">
                      <input
                        type="checkbox"
                        name="permission_ids"
                        value={permission.id}
                        defaultChecked={assigned.has(permission.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm font-medium text-neutral-900">
                          {permission.permission_name ?? permission.permission_key}
                        </span>
                        <span className="block font-mono text-xs text-neutral-500">
                          {permission.permission_key}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
          <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
            Save Role
          </button>
        </section>
      </form>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input name={name} required={required} defaultValue={defaultValue ?? ""} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
    </label>
  );
}
