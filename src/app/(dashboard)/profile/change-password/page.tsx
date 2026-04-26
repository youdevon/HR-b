import { redirect } from "next/navigation";
import PageHeader from "@/components/layout/page-header";
import { FormActions, FormLabel } from "@/components/ui/form-primitives";
import { changePasswordWithCurrentPassword } from "@/lib/auth/user";
import {
  formErrorAlertClass,
  formInputClass,
  formPrimaryButtonClass,
  formSuccessAlertClass,
} from "@/lib/ui/form-styles";

type ChangePasswordPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstString(value: string | string[] | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0];
  return undefined;
}

export default async function ChangePasswordPage({
  searchParams,
}: ChangePasswordPageProps) {
  const sp = await searchParams;
  const status = firstString(sp.status);
  const message = firstString(sp.message);

  async function changePasswordAction(formData: FormData) {
    "use server";
    const currentPassword = String(formData.get("current_password") ?? "");
    const newPassword = String(formData.get("new_password") ?? "");
    const confirmPassword = String(formData.get("confirm_password") ?? "");

    const result = await changePasswordWithCurrentPassword({
      currentPassword,
      newPassword,
      confirmPassword,
    });

    const qs = new URLSearchParams();
    qs.set("status", result.ok ? "success" : "error");
    qs.set("message", result.message);
    redirect(`/profile/change-password?${qs.toString()}`);
  }

  return (
    <main className="space-y-6">
        <PageHeader
          title="Change Password"
          description="Update your account password securely."
          backHref="/profile"
        />

        {message ? (
          <section className={status === "success" ? formSuccessAlertClass : formErrorAlertClass}>{message}</section>
        ) : null}

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <form action={changePasswordAction} className="space-y-5">
            <Field
              label="Current Password"
              name="current_password"
              placeholder="Enter current password"
            />
            <Field
              label="New Password"
              name="new_password"
              placeholder="Enter new password"
              minLength={8}
            />
            <Field
              label="Confirm New Password"
              name="confirm_password"
              placeholder="Re-enter new password"
              minLength={8}
            />
            <div className="pt-2">
              <button
                type="submit"
                className="rounded-xl bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800"
              >
                Save Password
              </button>
            </div>
          </form>
        </section>
    
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
  minLength,
}: {
  label: string;
  name: string;
  placeholder: string;
  minLength?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <FormLabel required>{label}</FormLabel>
      <input
        type="password"
        name={name}
        required
        minLength={minLength}
        placeholder={placeholder}
        className={formInputClass}
      />
    </label>
  );
}
