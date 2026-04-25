import {
  getAdminUserById,
  listRoles,
  updateAdminUser,
} from "@/lib/queries/admin";
import UserForm from "@/components/domain/admin/user-form";
import PageHeader from "@/components/layout/page-header";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { requirePermission } from "@/lib/auth/guards";

type EditAdminUserPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function redirectWithMessage(
  id: string,
  status: "success" | "error",
  message: string
): never {
  const qs = new URLSearchParams();
  qs.set("status", status);
  qs.set("message", message);
  redirect(`/admin/users/${id}/edit?${qs.toString()}`);
}

export default async function EditAdminUserPage({
  params,
  searchParams,
}: EditAdminUserPageProps) {
  const { id } = await params;
  const sp = await searchParams;
  await requirePermission("admin.users.edit");
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const [user, roles] = await Promise.all([getAdminUserById(id), listRoles()]);

  if (!user) notFound();

  async function updateUserAction(formData: FormData) {
    "use server";

    try {
      await updateAdminUser(id, {
        first_name: String(formData.get("first_name") ?? ""),
        last_name: String(formData.get("last_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone_number: String(formData.get("phone_number") ?? ""),
        role_id: String(formData.get("role_id") ?? ""),
        account_status: String(formData.get("account_status") ?? "Active"),
      });
      revalidatePath("/admin/users");
      revalidatePath(`/admin/users/${id}/edit`);
      redirectWithMessage(id, "success", "User profile updated successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user profile.";
      redirectWithMessage(id, "error", errorMessage);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Edit User"
          description="Update profile fields stored in public.user_profiles."
          backHref="/admin/users"
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

        <UserForm
          action={updateUserAction}
          roles={roles}
          mode="edit"
          user={user}
          submitLabel="Save User"
        />
      </div>
    </main>
  );
}
