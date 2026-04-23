"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { employeeSchema, type EmployeeInput } from "@/lib/validators/employee";

type EmployeeFormProps = {
  initialValues?: Partial<EmployeeInput>;
  submitLabel?: string;
  onSuccessRedirect?: string;
};

type FieldErrorMap = Partial<Record<keyof EmployeeInput, string>>;

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
  employment_status: "",
  employment_type: "",
  hire_date: "",
  id_type: "",
  id_number: "",
  other_id_description: "",
  bir_number: "",
  work_email: "",
  personal_email: "",
  mobile_number: "",
  file_status: "",
  file_location: "",
  file_notes: "",
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
  name: keyof EmployeeInput;
  value: string | undefined;
  onChange: (name: keyof EmployeeInput, value: string) => void;
  error?: string;
  type?: "text" | "email" | "date";
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

export default function EmployeeForm({
  initialValues,
  submitLabel = "Save Employee",
  onSuccessRedirect = "/employees",
}: EmployeeFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<EmployeeInput>({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sectionClassName = useMemo(
    () => "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6",
    [],
  );

  const handleChange = (name: keyof EmployeeInput, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (submitError) {
      setSubmitError("");
    }
    if (successMessage) {
      setSuccessMessage("");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = employeeSchema.safeParse(values);

    if (!parsed.success) {
      const nextErrors: FieldErrorMap = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof EmployeeInput | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setErrors(nextErrors);
      return;
    }

    // Client-side placeholder until API wiring is introduced.
    setErrors({});
    setSubmitError("");
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const payload = Object.fromEntries(
        Object.entries(parsed.data).map(([key, value]) => [key, value === "" ? null : value]),
      );

      const { error } = await supabase.from("employees").insert(payload);
      if (error) {
        throw new Error(error.message);
      }

      setSuccessMessage("Employee record created successfully.");
      router.push(onSuccessRedirect);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create employee.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Identity</h2>
        <p className="mt-1 text-sm text-neutral-600">Core employee identifiers and personal details.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Employee Number" name="employee_number" value={values.employee_number} onChange={handleChange} error={errors.employee_number} placeholder="EMP-0001" />
          <InputField label="File Number" name="file_number" value={values.file_number} onChange={handleChange} error={errors.file_number} placeholder="FILE-1001" />
          <InputField label="First Name" name="first_name" value={values.first_name} onChange={handleChange} error={errors.first_name} />
          <InputField label="Middle Name" name="middle_name" value={values.middle_name} onChange={handleChange} error={errors.middle_name} />
          <InputField label="Last Name" name="last_name" value={values.last_name} onChange={handleChange} error={errors.last_name} />
          <InputField label="Preferred Name" name="preferred_name" value={values.preferred_name} onChange={handleChange} error={errors.preferred_name} />
          <InputField label="Date of Birth" name="date_of_birth" type="date" value={values.date_of_birth} onChange={handleChange} error={errors.date_of_birth} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Employment</h2>
        <p className="mt-1 text-sm text-neutral-600">Organization and status information.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Department" name="department" value={values.department} onChange={handleChange} error={errors.department} />
          <InputField label="Division" name="division" value={values.division} onChange={handleChange} error={errors.division} />
          <InputField label="Job Title" name="job_title" value={values.job_title} onChange={handleChange} error={errors.job_title} />
          <InputField label="Employment Status" name="employment_status" value={values.employment_status} onChange={handleChange} error={errors.employment_status} placeholder="Active" />
          <InputField label="Employment Type" name="employment_type" value={values.employment_type} onChange={handleChange} error={errors.employment_type} placeholder="Full-time" />
          <InputField label="Hire Date" name="hire_date" type="date" value={values.hire_date} onChange={handleChange} error={errors.hire_date} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Identification & Tax</h2>
        <p className="mt-1 text-sm text-neutral-600">Government-issued ID and tax details.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="ID Type" name="id_type" value={values.id_type} onChange={handleChange} error={errors.id_type} placeholder="Passport / National ID / Other" />
          <InputField label="ID Number" name="id_number" value={values.id_number} onChange={handleChange} error={errors.id_number} />
          <InputField label="Other ID Description" name="other_id_description" value={values.other_id_description} onChange={handleChange} error={errors.other_id_description} />
          <InputField label="BIR Number" name="bir_number" value={values.bir_number} onChange={handleChange} error={errors.bir_number} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Contact</h2>
        <p className="mt-1 text-sm text-neutral-600">Corporate and personal communication channels.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Work Email" name="work_email" type="email" value={values.work_email} onChange={handleChange} error={errors.work_email} />
          <InputField label="Personal Email" name="personal_email" type="email" value={values.personal_email} onChange={handleChange} error={errors.personal_email} />
          <InputField label="Mobile Number" name="mobile_number" value={values.mobile_number} onChange={handleChange} error={errors.mobile_number} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Physical File</h2>
        <p className="mt-1 text-sm text-neutral-600">Track status and storage of the physical employee file.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="File Status" name="file_status" value={values.file_status} onChange={handleChange} error={errors.file_status} />
          <InputField label="File Location" name="file_location" value={values.file_location} onChange={handleChange} error={errors.file_location} />
        </div>
        <label className="mt-4 block space-y-2">
          <span className="text-sm font-medium text-neutral-700">File Notes</span>
          <textarea
            name="file_notes"
            rows={4}
            value={values.file_notes ?? ""}
            onChange={(event) => handleChange("file_notes", event.target.value)}
            className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
          />
          {errors.file_notes ? <p className="text-xs text-red-600">{errors.file_notes}</p> : null}
        </label>
      </section>

      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <p className="text-sm text-neutral-600">All required fields are validated before submission.</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800"
        >
          {isSubmitting ? "Saving..." : submitLabel}
        </button>
      </div>

      {submitError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      ) : null}

      {successMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {successMessage}
        </div>
      ) : null}
    </form>
  );
}
