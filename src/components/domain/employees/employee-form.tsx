"use client";

import { useState, useTransition } from "react";
import type { EmployeeInput } from "@/lib/validators/employee";

type EmployeeFormProps = {
  onSubmitAction: (data: EmployeeInput) => Promise<void>;
};

const defaultValues: EmployeeInput = {
  employee_number: "",
  file_number: "",
  first_name: "",
  middle_name: "",
  last_name: "",
  preferred_name: "",
  date_of_birth: "",
  department: "",
  division: "",
  job_title: "",
  employment_status: "active",
  employment_type: "contract",
  hire_date: "",
  id_type: "national_id",
  id_number: "",
  other_id_description: "",
  bir_number: "",
  work_email: "",
  personal_email: "",
  mobile_number: "",
  file_status: "active",
  file_location: "",
  file_notes: "",
};

export default function EmployeeForm({ onSubmitAction }: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeInput>(defaultValues);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateField<K extends keyof EmployeeInput>(
    key: K,
    value: EmployeeInput[K]
  ) {
    setFormData((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await onSubmitAction(formData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to create employee. Please try again."
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Employee Details
          </h2>
          <p className="text-sm text-neutral-500">
            Basic identifying information for the employee record.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Employee Number"
            value={formData.employee_number}
            onChange={(value) => updateField("employee_number", value)}
            required
          />
          <Field
            label="File Number"
            value={formData.file_number}
            onChange={(value) => updateField("file_number", value)}
            required
          />
          <Field
            label="First Name"
            value={formData.first_name}
            onChange={(value) => updateField("first_name", value)}
            required
          />
          <Field
            label="Middle Name"
            value={formData.middle_name ?? ""}
            onChange={(value) => updateField("middle_name", value)}
          />
          <Field
            label="Last Name"
            value={formData.last_name}
            onChange={(value) => updateField("last_name", value)}
            required
          />
          <Field
            label="Preferred Name"
            value={formData.preferred_name ?? ""}
            onChange={(value) => updateField("preferred_name", value)}
          />
          <Field
            label="Date of Birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(value) => updateField("date_of_birth", value)}
            required
          />
          <Field
            label="Hire Date"
            type="date"
            value={formData.hire_date}
            onChange={(value) => updateField("hire_date", value)}
            required
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Work Information
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Department"
            value={formData.department}
            onChange={(value) => updateField("department", value)}
            required
          />
          <Field
            label="Division"
            value={formData.division ?? ""}
            onChange={(value) => updateField("division", value)}
          />
          <Field
            label="Job Title"
            value={formData.job_title}
            onChange={(value) => updateField("job_title", value)}
            required
          />

          <SelectField
            label="Employment Status"
            value={formData.employment_status}
            onChange={(value) => updateField("employment_status", value)}
            options={[
              ["active", "Active"],
              ["inactive", "Inactive"],
              ["archived", "Archived"],
            ]}
          />

          <SelectField
            label="Employment Type"
            value={formData.employment_type}
            onChange={(value) => updateField("employment_type", value)}
            options={[
              ["contract", "Contract"],
              ["permanent", "Permanent"],
              ["temporary", "Temporary"],
              ["consultant", "Consultant"],
              ["other", "Other"],
            ]}
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Identification
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SelectField
            label="ID Type"
            value={formData.id_type}
            onChange={(value) => updateField("id_type", value)}
            options={[
              ["national_id", "National ID"],
              ["drivers_permit", "Driver's Permit"],
              ["other", "Other"],
            ]}
          />
          <Field
            label="ID Number"
            value={formData.id_number}
            onChange={(value) => updateField("id_number", value)}
            required
          />
          <Field
            label="Other ID Description"
            value={formData.other_id_description ?? ""}
            onChange={(value) => updateField("other_id_description", value)}
          />
          <Field
            label="BIR Number"
            value={formData.bir_number}
            onChange={(value) => updateField("bir_number", value)}
            required
          />
        </div>
      </section>

      <section className="space-y-4 border-t border-neutral-200 pt-6">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Contact and File
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Work Email"
            type="email"
            value={formData.work_email ?? ""}
            onChange={(value) => updateField("work_email", value)}
          />
          <Field
            label="Personal Email"
            type="email"
            value={formData.personal_email ?? ""}
            onChange={(value) => updateField("personal_email", value)}
          />
          <Field
            label="Mobile Number"
            value={formData.mobile_number ?? ""}
            onChange={(value) => updateField("mobile_number", value)}
          />
          <SelectField
            label="File Status"
            value={formData.file_status}
            onChange={(value) => updateField("file_status", value)}
            options={[
              ["active", "Active"],
              ["archived", "Archived"],
              ["missing", "Missing"],
              ["transferred", "Transferred"],
            ]}
          />
          <Field
            label="File Location"
            value={formData.file_location ?? ""}
            onChange={(value) => updateField("file_location", value)}
          />
          <div className="md:col-span-2">
            <TextArea
              label="File Notes"
              value={formData.file_notes ?? ""}
              onChange={(value) => updateField("file_notes", value)}
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end gap-3 border-t border-neutral-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Create Employee"}
        </button>
      </div>
    </form>
  );
}
type FieldProps = {
  label: string;
  value: string | undefined;
  type?: string;
  required?: boolean;
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  type = "text",
  required = false,
  onChange,
}: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string | undefined;
  options: Array<[string, string]>;
  onChange: (value: string) => void;
};

function SelectField({ label, value, options, onChange }: SelectFieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

type TextAreaProps = {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
};

function TextArea({ label, value, onChange }: TextAreaProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <textarea
        value={value ?? ""}
        rows={4}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
      />
    </label>
  );
}