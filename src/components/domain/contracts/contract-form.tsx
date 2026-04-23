"use client";

import { useMemo, useState } from "react";
import { contractSchema, type ContractInput } from "@/lib/validators/contract";

type ContractFormProps = {
  initialValues?: Partial<ContractInput>;
  submitLabel?: string;
  /** When true, shows a short note that persistence is wired separately (e.g. route handler or server action). */
  showPersistenceHint?: boolean;
  /** Called after Zod validation succeeds with the parsed payload. */
  onValidated?: (data: ContractInput) => void;
};

type FieldErrorMap = Partial<Record<keyof ContractInput, string>>;

const defaultValues: ContractInput = {
  employee_id: "",
  contract_number: "",
  contract_title: "",
  contract_type: "",
  contract_status: "",
  start_date: "",
  end_date: "",
  effective_date: "",
  notice_period: "",
  probation_start_date: "",
  probation_end_date: "",
  renewal_due_date: "",
  department: "",
  division: "",
  job_title: "",
  work_location: "",
  salary_amount: "",
  salary_frequency: "",
  allowances_summary: "",
  is_gratuity_eligible: false,
  supporting_notes: "",
  signed_date: "",
  issued_date: "",
  renewal_status: "",
  renewal_notes: "",
};

function InputField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
}: {
  label: string;
  name: keyof ContractInput;
  value: string | undefined;
  onChange: (name: keyof ContractInput, value: string) => void;
  error?: string;
  type?: "text" | "date";
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        name={name}
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(name, event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </label>
  );
}

export default function ContractForm({
  initialValues,
  submitLabel = "Save Contract",
  showPersistenceHint = false,
  onValidated,
}: ContractFormProps) {
  const [values, setValues] = useState<ContractInput>({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [successMessage, setSuccessMessage] = useState("");

  const sectionClassName = useMemo(
    () => "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6",
    [],
  );

  const handleChange = (name: keyof ContractInput, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = contractSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrorMap = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof ContractInput | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    onValidated?.(parsed.data);
    setSuccessMessage("Contract record passed validation and is ready to persist.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {showPersistenceHint ? (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Validation runs in the browser. To save, call <code className="rounded bg-white/80 px-1">createContract</code> from a
          server context (route handler or server action) using the same payload shape mapped to{" "}
          <code className="rounded bg-white/80 px-1">public.contracts</code>.
        </div>
      ) : null}
      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Contract Basics</h2>
        <p className="mt-1 text-sm text-neutral-600">Essential contract and employee linkage details.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Employee ID" name="employee_id" value={values.employee_id} onChange={handleChange} error={errors.employee_id} placeholder="emp_001" />
          <InputField label="Contract Number" name="contract_number" value={values.contract_number} onChange={handleChange} error={errors.contract_number} placeholder="CTR-2026-0001" />
          <InputField label="Contract Title" name="contract_title" value={values.contract_title} onChange={handleChange} error={errors.contract_title} />
          <InputField label="Contract Type" name="contract_type" value={values.contract_type} onChange={handleChange} error={errors.contract_type} placeholder="Full-time" />
          <InputField label="Contract Status" name="contract_status" value={values.contract_status} onChange={handleChange} error={errors.contract_status} placeholder="Active" />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Dates & Milestones</h2>
        <p className="mt-1 text-sm text-neutral-600">Lifecycle dates, probation, and renewal milestones.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Start Date" name="start_date" type="date" value={values.start_date} onChange={handleChange} error={errors.start_date} />
          <InputField label="End Date" name="end_date" type="date" value={values.end_date} onChange={handleChange} error={errors.end_date} />
          <InputField label="Effective Date" name="effective_date" type="date" value={values.effective_date} onChange={handleChange} error={errors.effective_date} />
          <InputField label="Notice Period" name="notice_period" value={values.notice_period} onChange={handleChange} error={errors.notice_period} placeholder="30 days" />
          <InputField label="Probation Start Date" name="probation_start_date" type="date" value={values.probation_start_date} onChange={handleChange} error={errors.probation_start_date} />
          <InputField label="Probation End Date" name="probation_end_date" type="date" value={values.probation_end_date} onChange={handleChange} error={errors.probation_end_date} />
          <InputField label="Renewal Due Date" name="renewal_due_date" type="date" value={values.renewal_due_date} onChange={handleChange} error={errors.renewal_due_date} />
          <InputField label="Signed Date" name="signed_date" type="date" value={values.signed_date} onChange={handleChange} error={errors.signed_date} />
          <InputField label="Issued Date" name="issued_date" type="date" value={values.issued_date} onChange={handleChange} error={errors.issued_date} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Role & Workplace</h2>
        <p className="mt-1 text-sm text-neutral-600">Departmental and work assignment details.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Department" name="department" value={values.department} onChange={handleChange} error={errors.department} />
          <InputField label="Division" name="division" value={values.division} onChange={handleChange} error={errors.division} />
          <InputField label="Job Title" name="job_title" value={values.job_title} onChange={handleChange} error={errors.job_title} />
          <InputField label="Work Location" name="work_location" value={values.work_location} onChange={handleChange} error={errors.work_location} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Compensation & Benefits</h2>
        <p className="mt-1 text-sm text-neutral-600">Salary, allowances, and gratuity eligibility.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Salary Amount" name="salary_amount" value={values.salary_amount} onChange={handleChange} error={errors.salary_amount} placeholder="12000.00" />
          <InputField label="Salary Frequency" name="salary_frequency" value={values.salary_frequency} onChange={handleChange} error={errors.salary_frequency} placeholder="Monthly" />
          <label className="space-y-2 md:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium text-neutral-700">Allowances Summary</span>
            <textarea
              name="allowances_summary"
              rows={3}
              value={values.allowances_summary ?? ""}
              onChange={(event) => handleChange("allowances_summary", event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            {errors.allowances_summary ? <p className="text-xs text-red-600">{errors.allowances_summary}</p> : null}
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              checked={values.is_gratuity_eligible}
              onChange={(event) => handleChange("is_gratuity_eligible", event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
            />
            <span className="text-sm font-medium text-neutral-700">Eligible for gratuity</span>
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Notes & Renewal</h2>
        <p className="mt-1 text-sm text-neutral-600">Supporting notes and renewal progress.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Supporting Notes</span>
            <textarea
              name="supporting_notes"
              rows={4}
              value={values.supporting_notes ?? ""}
              onChange={(event) => handleChange("supporting_notes", event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            {errors.supporting_notes ? <p className="text-xs text-red-600">{errors.supporting_notes}</p> : null}
          </label>
          <div className="space-y-4">
            <InputField label="Renewal Status" name="renewal_status" value={values.renewal_status} onChange={handleChange} error={errors.renewal_status} placeholder="Pending Review" />
            <label className="space-y-2">
              <span className="text-sm font-medium text-neutral-700">Renewal Notes</span>
              <textarea
                name="renewal_notes"
                rows={4}
                value={values.renewal_notes ?? ""}
                onChange={(event) => handleChange("renewal_notes", event.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
              />
              {errors.renewal_notes ? <p className="text-xs text-red-600">{errors.renewal_notes}</p> : null}
            </label>
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <p className="text-sm text-neutral-600">Required fields are validated before submission.</p>
        <button
          type="submit"
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          {submitLabel}
        </button>
      </div>

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}
    </form>
  );
}
