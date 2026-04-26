import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import RolePermissionsForm from "@/components/domain/admin/role-permissions-form";
import { createRole, listPermissions, updateRolePermissions } from "@/lib/queries/admin";
import { requirePermission } from "@/lib/auth/guards";

async function createRoleAction(formData: FormData) {
  "use server";
  await requirePermission("admin.roles.manage");
  const permissionIds = formData
    .getAll("permission_ids")
    .map((value) => String(value))
    .filter(Boolean);

  const role = await createRole({
    role_name: String(formData.get("role_name") ?? ""),
    role_code: String(formData.get("role_code") ?? ""),
    description: String(formData.get("description") ?? ""),
    is_active: String(formData.get("is_active") ?? "true") === "true",
  });
  await updateRolePermissions(role.id, permissionIds);
  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}

export default async function NewRolePage() {
  await requirePermission("admin.roles.manage");
  const permissions = await listPermissions();

  return (
    <main className="space-y-6">
      <PageHeader
        title="Create Role"
        description="Role codes are saved uppercase with underscores."
        backHref="/admin/roles"
      />
      <RolePermissionsForm action={createRoleAction} submitLabel="Create Role" permissions={permissions} />
    </main>
  );
}
