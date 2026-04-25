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

          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Role</span>
            <select
              name="role_id"
              defaultValue={user?.role_id ?? ""}
              required
              disabled={roles.length === 0}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            >
              <option value="">{roles.length ? "Select role" : "No roles available"}</option>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.role_name ?? role.role_code ?? "Role"}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Account Status</span>
            <select
              name="account_status"
              defaultValue={user?.account_status ?? "Active"}
              className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
            >
              {accountStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <button
          type="submit"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          {submitLabel}
        </button>
      </div>
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
    <label className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
      />
    </label>
  );
}
