import { redirect } from "next/navigation";
import { changePasswordWithCurrentPassword } from "@/lib/auth/user";

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
    <main className="min-h-screen bg-neutral-100 p-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-neutral-900">Change Password</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Update your account password securely.
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
            />
            <Field
              label="Confirm New Password"
              name="confirm_password"
              placeholder="Re-enter new password"
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
      </div>
    </main>
  );
}

function Field({
  label,
  name,
  placeholder,
}: {
  label: string;
  name: string;
  placeholder: string;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        type="password"
        name={name}
        required
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2.5 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
      />
    </label>
  );
}