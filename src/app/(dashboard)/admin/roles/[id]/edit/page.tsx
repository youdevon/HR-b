import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import RolePermissionsForm from "@/components/domain/admin/role-permissions-form";
import PageHeader from "@/components/layout/page-header";
import {
  getRoleById,
  listPermissions,
  listRolePermissionIds,
  updateRole,
  updateRolePermissions,
} from "@/lib/queries/admin";
import { requirePermission } from "@/lib/auth/guards";

type EditRolePageProps = { params: Promise<{ id: string }> };

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

  return (
    <main className="space-y-6">
      <PageHeader
        title="Edit Role"
        description="Update role details and assigned permissions."
        backHref="/admin/roles"
      />
      <RolePermissionsForm
        action={saveRoleAction}
        submitLabel="Save Role"
        permissions={permissions}
        assignedPermissionIds={assignedPermissionIds}
        defaultValues={{
          role_name: role.role_name,
          role_code: role.role_code,
          description: role.description,
          is_active: role.is_active,
        }}
        showSystemRoleNotice={Boolean(role.is_system_role)}
      />
    </main>
  );
}
