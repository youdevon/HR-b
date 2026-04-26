"use client";

import { useState, useTransition } from "react";
import { FormActions, FormLabel } from "@/components/ui/form-primitives";
import {
  formCheckboxClass,
  formCheckboxRowClass,
  formErrorAlertClass,
  formHelperClass,
  formInputClass,
  formPrimaryButtonClass,
  formSelectClass,
  formTextareaClass,
} from "@/lib/ui/form-styles";
import { cn } from "@/lib/utils/cn";
import type { EmployeeInput } from "@/lib/validators/employee";

type EmployeeFormProps = {
  initialValues?: Partial<EmployeeInput>;
  onSubmitAction: (data: EmployeeInput) => Promise<void>;
  submitLabel?: string;
};

const defaultValues: EmployeeInput = {
  employee_number: "",
  no_employee_number: false,
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

export default function EmployeeForm({
  initialValues,
  onSubmitAction,
  submitLabel = "Create Employee",
}: EmployeeFormProps) {
  const hasInitialValues = Boolean(initialValues && Object.keys(initialValues).length > 0);
  const [formData, setFormData] = useState<EmployeeInput>({
    ...defaultValues,
    ...initialValues,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [noEmployeeNumber, setNoEmployeeNumber] = useState(
    Boolean(initialValues?.no_employee_number) ||
      (hasInitialValues && !(initialValues?.employee_number ?? "").trim())
  );

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
        const payload: EmployeeInput = {
          ...formData,
          employee_number: noEmployeeNumber ? "" : formData.employee_number ?? "",
          no_employee_number: noEmployeeNumber,
        };
        await onSubmitAction(payload);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to save employee. Please try again."
        );
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      {error ? <div className={formErrorAlertClass}>{error}</div> : null}

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
            placeholder={noEmployeeNumber ? "Not assigned" : "Enter employee number"}
            hint="Optional. Leave blank to use the File Number as the Employee Number."
            disabled={noEmployeeNumber}
          />
          <Field
            label="File Number"
            value={formData.file_number}
            onChange={(value) => updateField("file_number", value)}
            required
            placeholder="Enter file number"
            hint="Required. Must be unique."
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
        <label className={cn("mt-2", formCheckboxRowClass)}>
          <input
            type="checkbox"
            checked={noEmployeeNumber}
            onChange={(event) => {
              const checked = event.target.checked;
              setNoEmployeeNumber(checked);
              if (checked) updateField("employee_number", "");
            }}
            className={formCheckboxClass}
          />
          <span className="text-sm text-neutral-700">
            <span className="font-medium">This employee does not have an employee number</span>
          </span>
        </label>
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
            hint="Optional. Must be unique when provided."
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
            hint="Optional. This can be completed later."
            placeholder="Not recorded"
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

      <FormActions>
        <button type="submit" disabled={isPending} className={formPrimaryButtonClass}>
          {isPending ? "Saving..." : submitLabel}
        </button>
      </FormActions>
    </form>
  );
}
type FieldProps = {
  label: string;
  value: string | null | undefined;
  type?: string;
  required?: boolean;
  placeholder?: string;
  hint?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function Field({
  label,
  value,
  type = "text",
  required = false,
  placeholder,
  hint,
  disabled = false,
  onChange,
}: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
        type={type}
        value={value ?? ""}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200 disabled:cursor-not-allowed disabled:bg-neutral-50"
      />
      {hint ? <span className="text-xs text-neutral-500">{hint}</span> : null}
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
    <label className="block space-y-1.5">
      <FormLabel>{label}</FormLabel>
      <select value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={formSelectClass}>
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
    <label className="block space-y-1.5">
      <FormLabel>{label}</FormLabel>
      <textarea value={value ?? ""} onChange={(event) => onChange(event.target.value)} className={formTextareaClass} />
    </label>
  );
}