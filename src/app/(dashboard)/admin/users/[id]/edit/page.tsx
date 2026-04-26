import {
  deactivateAdminUserAccount,
  deleteAdminUserAccount,
  getAdminUserById,
  listRoles,
  userHasRecordedActivity,
  updateAdminUser,
  updateAdminUserPassword,
} from "@/lib/queries/admin";
import DeleteUserAccountForm from "@/components/domain/admin/delete-user-account-form";
import UserForm from "@/components/domain/admin/user-form";
import PageHeader from "@/components/layout/page-header";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound, redirect } from "next/navigation";
import { assertPermission, requirePermission } from "@/lib/auth/guards";
import { getCurrentUserId } from "@/lib/auth/session";
import { dashboardAlertErrorClass, dashboardAlertSuccessClass } from "@/lib/ui/dashboard-styles";
import { listEmployeeLookupOptions } from "@/lib/queries/employees";

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
  const [user, roles, hasRecordedActivity, employees] = await Promise.all([
    getAdminUserById(id),
    listRoles(),
    userHasRecordedActivity(id),
    listEmployeeLookupOptions(500),
  ]);

  if (!user) notFound();

  async function updateUserAction(formData: FormData) {
    "use server";
    await assertPermission("admin.users.edit");

    try {
      const newPassword = String(formData.get("new_password") ?? "");
      const confirmNewPassword = String(formData.get("confirm_new_password") ?? "");
      const hasNewPassword = Boolean(newPassword);
      const hasConfirmNewPassword = Boolean(confirmNewPassword);

      if (hasNewPassword && !hasConfirmNewPassword) {
        redirectWithMessage(id, "error", "Please confirm the new password.");
      }
      if (!hasNewPassword && hasConfirmNewPassword) {
        redirectWithMessage(id, "error", "Please enter the new password.");
      }
      if (hasNewPassword && hasConfirmNewPassword) {
        if (newPassword.length < 8) {
          redirectWithMessage(id, "error", "Password must be at least 8 characters.");
        }
        if (newPassword !== confirmNewPassword) {
          redirectWithMessage(id, "error", "Passwords do not match.");
        }
      }

      await updateAdminUser(id, {
        first_name: String(formData.get("first_name") ?? ""),
        last_name: String(formData.get("last_name") ?? ""),
        email: String(formData.get("email") ?? ""),
        phone_number: String(formData.get("phone_number") ?? ""),
        role_id: String(formData.get("role_id") ?? ""),
        account_status: String(formData.get("account_status") ?? "Active"),
        employee_id: String(formData.get("employee_id") ?? ""),
      });
      if (hasNewPassword && hasConfirmNewPassword) {
        await updateAdminUserPassword(id, newPassword);
      }
      revalidatePath("/admin/users");
      revalidatePath(`/admin/users/${id}/edit`);
      redirectWithMessage(id, "success", "User profile updated successfully.");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update user profile.";
      redirectWithMessage(id, "error", errorMessage);
    }
  }

  async function deleteUserAction(formData: FormData) {
    "use server";
    await assertPermission("admin.users.edit");
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      redirectWithMessage(id, "error", "Unable to validate the current user session.");
    }
    const confirmed = String(formData.get("confirm_delete") ?? "") === "on";
    if (!confirmed) {
      redirectWithMessage(
        id,
        "error",
        "Please confirm deletion before removing this user account."
      );
    }

    try {
      await deleteAdminUserAccount(id, currentUserId);
      revalidatePath("/admin/users");
      redirect("/admin/users?deleted=1");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to delete user account.";
      redirectWithMessage(id, "error", errorMessage);
    }
  }

  async function deactivateUserAction(formData: FormData) {
    "use server";
    await assertPermission("admin.users.edit");
    const currentUserId = await getCurrentUserId();
    if (!currentUserId) {
      redirectWithMessage(id, "error", "Unable to validate the current user session.");
    }
    const confirmed = String(formData.get("confirm_deactivate") ?? "") === "on";
    if (!confirmed) {
      redirectWithMessage(
        id,
        "error",
        "Please confirm deactivation before disabling this user account."
      );
    }
    try {
      await deactivateAdminUserAccount(id, currentUserId);
      revalidatePath("/admin/users");
      redirect("/admin/users?deactivated=1");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to deactivate user account.";
      redirectWithMessage(id, "error", errorMessage);
    }
  }

  return (
    <main className="space-y-6">
        <PageHeader
          title="Edit User"
          description="Update profile fields stored in public.user_profiles."
          backHref="/admin/users"
        />

        {message ? (
          <section className={status === "success" ? dashboardAlertSuccessClass : dashboardAlertErrorClass}>
            {message}
          </section>
        ) : null}

        <UserForm
          action={updateUserAction}
          roles={roles}
          mode="edit"
          user={user}
          submitLabel="Save User"
          employees={employees}
        />

        <section className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-red-800">Account Removal</h2>
          <p className="mt-1 text-sm text-red-700">
            Delete is only available for accounts with no recorded activity. Accounts with
            recorded activity must be deactivated to preserve audit history.
          </p>

          {hasRecordedActivity ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-red-700">
                This user account cannot be deleted because activity has already been recorded. You
                may deactivate the account instead.
              </p>
              <DeleteUserAccountForm
                action={deactivateUserAction}
                confirmFieldName="confirm_deactivate"
                confirmLabel="I understand this will deactivate the user's account."
                buttonLabel="Deactivate Account"
                buttonClassName="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                checkboxClassName="mt-0.5 h-4 w-4 rounded border-red-300 text-red-700"
                labelClassName="flex items-start gap-2 text-sm text-red-800"
              />
            </div>
          ) : (
            <div className="mt-4">
              <DeleteUserAccountForm action={deleteUserAction} />
            </div>
          )}
        </section>
    
    </main>
  );
}
