import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import UserForm from "@/components/domain/admin/user-form";
import PageHeader from "@/components/layout/page-header";
import { createAdminUser, listRoles } from "@/lib/queries/admin";
import { requirePermission } from "@/lib/auth/guards";

type NewAdminUserPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

function redirectWithMessage(status: "success" | "error", message: string): never {
  const qs = new URLSearchParams();
  qs.set("status", status);
  qs.set("message", message);
  redirect(`/admin/users/new?${qs.toString()}`);
}

export default async function NewAdminUserPage({
  searchParams,
}: NewAdminUserPageProps) {
  const sp = await searchParams;
  await requirePermission("admin.users.create");
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const roles = await listRoles();

  async function createUserAction(formData: FormData) {
    "use server";

    try {
      await createAdminUser({
        first_name: String(formData.get("first_name") ?? ""),
        last_name: String(formData.get("last_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone_number: String(formData.get("phone_number") ?? ""),
        role_id: String(formData.get("role_id") ?? ""),
        account_status: String(formData.get("account_status") ?? "Active"),
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create user.";
      redirectWithMessage("error", errorMessage);
    }

    revalidatePath("/admin/users");
    const qs = new URLSearchParams();
    qs.set("status", "success");
    qs.set("message", "User created successfully.");
    redirect(`/admin/users?${qs.toString()}`);
  }

  return (
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Create User"
          description="Create a public.user_profiles row for application access."
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
          action={createUserAction}
          roles={roles}
          mode="create"
          submitLabel="Create User"
        />
      </div>
    </main>
  );
}
