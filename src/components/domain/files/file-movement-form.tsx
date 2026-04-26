"use client";

import { useMemo, useState } from "react";
import { FormActions, FormFieldError, FormLabel, FormSuccessAlert } from "@/components/ui/form-primitives";
import {
  formInputClass,
  formSelectClass,
  formTextareaClass,
  formPrimaryButtonClass,
} from "@/lib/ui/form-styles";
import { fileMovementSchema, movementStatuses, type FileMovementInput } from "@/lib/validators/file-movement";

type FileMovementFormProps = {
  initialValues?: Partial<FileMovementInput>;
  submitLabel?: string;
};

type FieldErrorMap = Partial<Record<keyof FileMovementInput, string>>;

const defaultValues: FileMovementInput = {
  employee_id: "",
  file_number: "",
  from_department: "",
  to_department: "",
  from_location: "",
  to_location: "",
  from_custodian: "",
  to_custodian: "",
  date_sent: "",
  date_received: "",
  movement_status: "with_hr",
  movement_reason: "",
  remarks: "",
};

function InputField({
  label,
  name,
  value,
  onChange,
  error,
  type = "text",
}: {
  label: string;
  name: keyof FileMovementInput;
  value: string | undefined;
  onChange: (name: keyof FileMovementInput, value: string) => void;
  error?: string;
  type?: "text" | "date";
}) {
  return (
    <label className="space-y-1.5">
      <FormLabel>{label}</FormLabel>
      <input
        type={type}
        value={value ?? ""}
        onChange={(event) => onChange(name, event.target.value)}
        className={formInputClass}
      />
      {error ? <FormFieldError>{error}</FormFieldError> : null}
    </label>
  );
}

export default function FileMovementForm({ initialValues, submitLabel = "Save Movement" }: FileMovementFormProps) {
  const [values, setValues] = useState<FileMovementInput>({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [successMessage, setSuccessMessage] = useState("");

  const sectionClassName = useMemo(
    () => "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6",
    [],
  );

  const handleChange = (name: keyof FileMovementInput, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = fileMovementSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrorMap = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FileMovementInput | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSuccessMessage("File movement record is valid and ready to be submitted.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Movement Basics</h2>
        <p className="mt-1 text-sm text-neutral-600">Employee, file, and status information.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Employee ID" name="employee_id" value={values.employee_id} onChange={handleChange} error={errors.employee_id} />
          <InputField label="File Number" name="file_number" value={values.file_number} onChange={handleChange} error={errors.file_number} />
          <label className="space-y-1.5">
            <FormLabel>Movement Status</FormLabel>
            <select
              value={values.movement_status}
              onChange={(event) => handleChange("movement_status", event.target.value)}
              className={formSelectClass}
            >
              {movementStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            {errors.movement_status ? <FormFieldError>{errors.movement_status}</FormFieldError> : null}
          </label>
          <InputField label="Date Sent" name="date_sent" type="date" value={values.date_sent} onChange={handleChange} error={errors.date_sent} />
          <InputField label="Date Received" name="date_received" type="date" value={values.date_received} onChange={handleChange} error={errors.date_received} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Routing</h2>
        <p className="mt-1 text-sm text-neutral-600">Track department/location/custodian handoff.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="From Department" name="from_department" value={values.from_department} onChange={handleChange} error={errors.from_department} />
          <InputField label="To Department" name="to_department" value={values.to_department} onChange={handleChange} error={errors.to_department} />
          <InputField label="From Location" name="from_location" value={values.from_location} onChange={handleChange} error={errors.from_location} />
          <InputField label="To Location" name="to_location" value={values.to_location} onChange={handleChange} error={errors.to_location} />
          <InputField label="From Custodian" name="from_custodian" value={values.from_custodian} onChange={handleChange} error={errors.from_custodian} />
          <InputField label="To Custodian" name="to_custodian" value={values.to_custodian} onChange={handleChange} error={errors.to_custodian} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Reason & Remarks</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <FormLabel>Movement Reason</FormLabel>
            <textarea
              value={values.movement_reason}
              onChange={(event) => handleChange("movement_reason", event.target.value)}
              className={formTextareaClass}
            />
            {errors.movement_reason ? <FormFieldError>{errors.movement_reason}</FormFieldError> : null}
          </label>
          <label className="space-y-1.5">
            <FormLabel>Remarks</FormLabel>
            <textarea
              value={values.remarks ?? ""}
              onChange={(event) => handleChange("remarks", event.target.value)}
              className={formTextareaClass}
            />
          </label>
        </div>
      </section>

      <p className="text-sm text-neutral-600">Required fields are validated before submission.</p>
      <FormActions>
        <button type="submit" className={formPrimaryButtonClass}>
          {submitLabel}
        </button>
      </FormActions>

      {successMessage ? <FormSuccessAlert>{successMessage}</FormSuccessAlert> : null}
    </form>
  );
}
