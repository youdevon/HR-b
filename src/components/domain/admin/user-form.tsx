import { FormActions, FormLabel } from "@/components/ui/form-primitives";
import {
  formHelperClass,
  formInputClass,
  formPrimaryButtonClass,
  formSelectClass,
} from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";
import type { AdminRoleRecord, AdminUserRecord } from "@/lib/queries/admin";

type UserFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  roles: AdminRoleRecord[];
  mode: "create" | "edit";
  submitLabel: string;
  user?: AdminUserRecord;
};

const accountStatuses = ["Active", "Pending", "Disabled", "Locked"];

export default function UserForm({
  action,
  roles,
  mode,
  submitLabel,
  user,
}: UserFormProps) {
  return (
    <form action={action} className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">User Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Field label="First Name" name="first_name" defaultValue={user?.first_name} required />
          <Field label="Last Name" name="last_name" defaultValue={user?.last_name} required />
          <Field
            label="Email"
            name="email"
            type="email"
            defaultValue={user?.email}
            required
          />
          <Field label="Phone Number" name="phone_number" defaultValue={user?.phone_number} />

          <label className="space-y-1.5">
            <FormLabel required>Role</FormLabel>
            <select
              name="role_id"
              defaultValue={user?.role_id ?? ""}
              required
              disabled={roles.length === 0}
              className={cn(formSelectClass, roles.length === 0 && "cursor-not-allowed")}
            >
              <option value="">{roles.length ? "Select role" : "No roles available"}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name ?? role.role_code ?? "Role"}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <FormLabel>Account Status</FormLabel>
            <select name="account_status" defaultValue={user?.account_status ?? "Active"} className={formSelectClass}>
              {accountStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          {mode === "create" ? (
            <>
              <label className="space-y-1.5">
                <FormLabel required>Password</FormLabel>
                <input name="password" type="password" required minLength={8} className={formInputClass} />
                <p className={formHelperClass}>Password must be at least 8 characters.</p>
              </label>
              <label className="space-y-1.5">
                <FormLabel required>Confirm Password</FormLabel>
                <input name="confirm_password" type="password" required minLength={8} className={formInputClass} />
              </label>
            </>
          ) : null}
        </div>
      </section>

      {mode === "edit" ? (
        <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
          <h2 className="text-lg font-semibold text-neutral-900">Password Reset</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Leave blank if you do not want to change this user&apos;s password.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1.5">
              <FormLabel>New Password</FormLabel>
              <input name="new_password" type="password" minLength={8} className={formInputClass} />
              <p className={formHelperClass}>Leave blank to keep the current password. Otherwise use at least 8 characters.</p>
            </label>
            <label className="space-y-1.5">
              <FormLabel>Confirm New Password</FormLabel>
              <input name="confirm_new_password" type="password" minLength={8} className={formInputClass} />
            </label>
          </div>
        </section>
      ) : null}

      <FormActions>
        <button type="submit" className={formPrimaryButtonClass}>
          {submitLabel}
        </button>
      </FormActions>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="space-y-1.5">
      <FormLabel required={required}>{label}</FormLabel>
      <input name={name} type={type} required={required} defaultValue={defaultValue ?? ""} className={formInputClass} />
    </label>
  );
}
