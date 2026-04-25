import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { createRole } from "@/lib/queries/admin";
import { requirePermission } from "@/lib/auth/guards";

async function createRoleAction(formData: FormData) {
  "use server";
  await createRole({
    role_name: String(formData.get("role_name") ?? ""),
    role_code: String(formData.get("role_code") ?? ""),
    description: String(formData.get("description") ?? ""),
    is_active: String(formData.get("is_active") ?? "true") === "true",
  });
  revalidatePath("/admin/roles");
  redirect("/admin/roles");
}

export default async function NewRolePage() {
  await requirePermission("admin.roles.manage");

  return (
    <main className="space-y-6">
      <PageHeader
        title="Create Role"
        description="Role codes are saved uppercase with underscores."
        backHref="/admin/roles"
      />
      <RoleForm action={createRoleAction} submitLabel="Create Role" />
    </main>
  );
}

function RoleForm({
  action,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
}) {
  return (
    <form action={action} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Role Name" name="role_name" required />
        <Field label="Role Code" name="role_code" required placeholder="HR_MANAGER" />
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-neutral-700">Description</span>
          <textarea name="description" rows={4} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-neutral-700">Active</span>
          <select name="is_active" defaultValue="true" className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </label>
      </div>
      <button type="submit" className="mt-5 rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
        {submitLabel}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input name={name} required={required} placeholder={placeholder} className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm" />
    </label>
  );
}
