"use client";

import { useState } from "react";
import { compensationSchema, type CompensationInput } from "@/lib/validators/compensation";

type Props = { initialValues?: Partial<CompensationInput>; submitLabel?: string };
type Errors = Partial<Record<keyof CompensationInput, string>>;

const defaults: CompensationInput = {
  employee_id: "",
  contract_id: "",
  salary_amount: "",
  salary_frequency: "",
  allowance_amount: "",
  allowance_notes: "",
  currency: "AED",
  effective_from: "",
  effective_to: "",
  compensation_status: "",
  change_type: "",
  change_reason: "",
  notes: "",
};

export default function CompensationForm({ initialValues, submitLabel = "Save Compensation" }: Props) {
  const [values, setValues] = useState<CompensationInput>({ ...defaults, ...initialValues });
  const [errors, setErrors] = useState<Errors>({});

  const onChange = (name: keyof CompensationInput, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = compensationSchema.safeParse(values);
        if (!parsed.success) {
          const next: Errors = {};
          parsed.error.issues.forEach((i) => {
            const key = i.path[0] as keyof CompensationInput;
            if (key && !next[key]) next[key] = i.message;
          });
          setErrors(next);
        } else {
          setErrors({});
        }
      }}
    >
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200">
        <h2 className="text-lg font-semibold text-neutral-900">Compensation Details</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[
            ["employee_id", "Employee ID"],
            ["contract_id", "Contract ID"],
            ["salary_amount", "Salary Amount"],
            ["salary_frequency", "Salary Frequency"],
            ["allowance_amount", "Allowance Amount"],
            ["currency", "Currency"],
            ["effective_from", "Effective From"],
            ["effective_to", "Effective To"],
            ["compensation_status", "Status"],
            ["change_type", "Change Type"],
          ].map(([k, label]) => (
            <label key={k} className="space-y-2">
              <span className="text-sm font-medium text-neutral-700">{label}</span>
              <input
                type={k.includes("date") || k.includes("effective_") ? "date" : "text"}
                value={values[k as keyof CompensationInput] as string}
                onChange={(e) => onChange(k as keyof CompensationInput, e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
              />
              {errors[k as keyof CompensationInput] ? <p className="text-xs text-red-600">{errors[k as keyof CompensationInput]}</p> : null}
            </label>
          ))}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <textarea
            value={values.allowance_notes}
            onChange={(e) => onChange("allowance_notes", e.target.value)}
            placeholder="Allowance notes"
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          />
          <textarea
            value={values.change_reason}
            onChange={(e) => onChange("change_reason", e.target.value)}
            placeholder="Change reason"
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200"
          />
          <textarea
            value={values.notes}
            onChange={(e) => onChange("notes", e.target.value)}
            placeholder="Notes"
            className="rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-neutral-200 md:col-span-2"
          />
        </div>
      </section>
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <button className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white">{submitLabel}</button>
      </div>
    </form>
  );
}
