"use client";

import { useState } from "react";
import { userSchema, type UserInput } from "@/lib/validators/user";

type Props = { initialValues?: Partial<UserInput>; submitLabel?: string };
type Errors = Partial<Record<keyof UserInput, string>>;

const defaults: UserInput = {
  full_name: "",
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  role_id: "",
  account_status: "",
  is_active: true,
};

export default function UserForm({ initialValues, submitLabel = "Save User" }: Props) {
  const [values, setValues] = useState<UserInput>({ ...defaults, ...initialValues });
  const [errors, setErrors] = useState<Errors>({});

  const setField = (name: keyof UserInput, value: string | boolean) => {
    setValues((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = userSchema.safeParse(values);
        if (!parsed.success) {
          const next: Errors = {};
          parsed.error.issues.forEach((i) => {
            const key = i.path[0] as keyof UserInput;
            if (key && !next[key]) next[key] = i.message;
          });
          setErrors(next);
        } else {
          setErrors({});
        }
      }}
    >
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">User Profile</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["full_name", "Full Name"],
            ["first_name", "First Name"],
            ["last_name", "Last Name"],
            ["email", "Email"],
            ["phone_number", "Phone Number"],
            ["role_id", "Role ID"],
            ["account_status", "Account Status"],
          ].map(([k, label]) => (
            <label key={k} className="space-y-2">
              <span className="text-sm font-medium text-neutral-700">{label}</span>
              <input
                value={values[k as keyof UserInput] as string}
                onChange={(e) => setField(k as keyof UserInput, e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
              />
              {errors[k as keyof UserInput] ? <p className="text-xs text-red-600">{errors[k as keyof UserInput]}</p> : null}
            </label>
          ))}
          <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input type="checkbox" checked={values.is_active} onChange={(e) => setField("is_active", e.target.checked)} />
            <span className="text-sm">Active account</span>
          </label>
        </div>
      </section>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">{submitLabel}</button>
      </div>
    </form>
  );
}
