import {
  getAdminUserById,
  listRoles,
  updateAdminUser,
  type AdminRoleRecord,
} from "@/lib/queries/admin";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";

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
  const status = firstString(sp.status);
  const message = firstString(sp.message);
  const [user, roles] = await Promise.all([getAdminUserById(id), listRoles()]);

  if (!user) notFound();

  async function updateUserAction(formData: FormData) {
    "use server";
    const accountStatus = String(formData.get("account_status") ?? "Active");

    try {
      await updateAdminUser(id, {
        first_name: String(formData.get("first_name") ?? ""),
        last_name: String(formData.get("last_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone_number: String(formData.get("phone_number") ?? ""),
        role_id: String(formData.get("role_id") ?? ""),
        account_status: accountStatus,
        is_active: accountStatus === "Active",
        password_reset_required: user.password_reset_required ?? false,
        new_password: String(formData.get("new_password") ?? ""),
        confirm_new_password: String(formData.get("confirm_new_password") ?? ""),
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
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Edit User</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Update profile fields stored in <code>public.user_profiles</code>.
          </p>
        </section>

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

        <form
          action={updateUserAction}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="First Name" name="first_name" defaultValue={user.first_name} />
            <Field label="Last Name" name="last_name" defaultValue={user.last_name} />
            <Field
              label="Email"
              name="email"
              type="email"
              defaultValue={user.email}
              required
            />
            <Field
              label="Phone Number"
              name="phone_number"
              defaultValue={user.phone_number}
            />
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Role</span>
              <select
                name="role_id"
                defaultValue={user.role_id ?? ""}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">No role</option>
                {roles.map((role: AdminRoleRecord) => (
                  <option key={role.id} value={role.id}>
                    {role.role_name ?? role.role_code ?? "Role"}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-medium text-neutral-700">Status</span>
              <select
                name="account_status"
                defaultValue={user.account_status ?? "Active"}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="Active">Active</option>
                <option value="Disabled">Disabled</option>
                <option value="Pending">Pending</option>
                <option value="Locked">Locked</option>
              </select>
            </label>
            <Field
              label="New Password"
              name="new_password"
              type="password"
              defaultValue={null}
              minLength={8}
            />
            <Field
              label="Confirm New Password"
              name="confirm_new_password"
              type="password"
              defaultValue={null}
              minLength={8}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/admin/users"
              className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
            >
              Back
            </a>
            <button
              type="submit"
              className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
            >
              Save User
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
  minLength,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm"
      />
    </label>
  );
}
