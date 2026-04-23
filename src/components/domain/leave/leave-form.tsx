"use client";

import { useMemo, useState } from "react";
import { leaveSchema, leaveTypes, type LeaveInput } from "@/lib/validators/leave";

type LeaveFormProps = {
  initialValues?: Partial<LeaveInput>;
  submitLabel?: string;
};

type FieldErrorMap = Partial<Record<keyof LeaveInput, string>>;

const defaultValues: LeaveInput = {
  employee_id: "",
  leave_type: "sick_leave",
  transaction_type: "",
  start_date: "",
  end_date: "",
  days: "",
  reason: "",
  status: "",
  notes: "",
  medical_certificate_required: false,
  medical_certificate_received: false,
  return_to_work_date: "",
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
  name: keyof LeaveInput;
  value: string | undefined;
  onChange: (name: keyof LeaveInput, value: string) => void;
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

export default function LeaveForm({ initialValues, submitLabel = "Save Leave Record" }: LeaveFormProps) {
  const [values, setValues] = useState<LeaveInput>({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [successMessage, setSuccessMessage] = useState("");

  const sectionClassName = useMemo(
    () => "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6",
    [],
  );

  const handleChange = (name: keyof LeaveInput, value: string | boolean) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = leaveSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrorMap = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof LeaveInput | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSuccessMessage("Leave transaction is valid and ready to be submitted.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Transaction Basics</h2>
        <p className="mt-1 text-sm text-neutral-600">Employee, leave type, and transaction details.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Employee ID" name="employee_id" value={values.employee_id} onChange={handleChange} error={errors.employee_id} placeholder="emp_001" />
          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Leave Type</span>
            <select
              value={values.leave_type}
              onChange={(event) => handleChange("leave_type", event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            >
              {leaveTypes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.leave_type ? <p className="text-xs text-red-600">{errors.leave_type}</p> : null}
          </label>
          <InputField label="Transaction Type" name="transaction_type" value={values.transaction_type} onChange={handleChange} error={errors.transaction_type} placeholder="debit / credit / adjustment" />
          <InputField label="Status" name="status" value={values.status} onChange={handleChange} error={errors.status} placeholder="Pending / Approved" />
          <InputField label="Days" name="days" value={values.days} onChange={handleChange} error={errors.days} placeholder="3 or 1.5" />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Dates</h2>
        <p className="mt-1 text-sm text-neutral-600">Leave period and return-to-work timing.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <InputField label="Start Date" name="start_date" type="date" value={values.start_date} onChange={handleChange} error={errors.start_date} />
          <InputField label="End Date" name="end_date" type="date" value={values.end_date} onChange={handleChange} error={errors.end_date} />
          <InputField label="Return to Work Date" name="return_to_work_date" type="date" value={values.return_to_work_date} onChange={handleChange} error={errors.return_to_work_date} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Reason & Notes</h2>
        <p className="mt-1 text-sm text-neutral-600">Document reason, context, and supporting notes.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Reason</span>
            <textarea
              rows={4}
              value={values.reason ?? ""}
              onChange={(event) => handleChange("reason", event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            {errors.reason ? <p className="text-xs text-red-600">{errors.reason}</p> : null}
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Notes</span>
            <textarea
              rows={4}
              value={values.notes ?? ""}
              onChange={(event) => handleChange("notes", event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
            {errors.notes ? <p className="text-xs text-red-600">{errors.notes}</p> : null}
          </label>
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Medical Certificate</h2>
        <p className="mt-1 text-sm text-neutral-600">Track whether a certificate is needed and received.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              checked={values.medical_certificate_required}
              onChange={(event) => handleChange("medical_certificate_required", event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
            />
            <span className="text-sm font-medium text-neutral-700">Medical certificate required</span>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
            <input
              type="checkbox"
              checked={values.medical_certificate_received}
              onChange={(event) => handleChange("medical_certificate_received", event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-400"
            />
            <span className="text-sm font-medium text-neutral-700">Medical certificate received</span>
          </label>
          {errors.medical_certificate_received ? (
            <p className="text-xs text-red-600">{errors.medical_certificate_received}</p>
          ) : null}
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
