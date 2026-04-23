"use client";

import { useMemo, useState } from "react";
import { documentCategories, documentSchema, type DocumentInput } from "@/lib/validators/document";

type DocumentFormProps = {
  initialValues?: Partial<DocumentInput>;
  submitLabel?: string;
};

type FieldErrorMap = Partial<Record<keyof DocumentInput, string>>;

const defaultValues: DocumentInput = {
  employee_id: "",
  contract_id: "",
  leave_transaction_id: "",
  gratuity_calculation_id: "",
  file_movement_id: "",
  document_category: "General",
  document_type: "",
  document_title: "",
  document_description: "",
  file_name: "",
  document_status: "",
  document_date: "",
  issued_date: "",
  expiry_date: "",
  visibility_level: "",
  notes: "",
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
  name: keyof DocumentInput;
  value: string | undefined;
  onChange: (name: keyof DocumentInput, value: string) => void;
  error?: string;
  type?: "text" | "date";
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      <input
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

export default function DocumentForm({ initialValues, submitLabel = "Save Document" }: DocumentFormProps) {
  const [values, setValues] = useState<DocumentInput>({ ...defaultValues, ...initialValues });
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [successMessage, setSuccessMessage] = useState("");

  const sectionClassName = useMemo(
    () => "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-200 sm:p-6",
    [],
  );

  const handleChange = (name: keyof DocumentInput, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    if (successMessage) setSuccessMessage("");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = documentSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: FieldErrorMap = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof DocumentInput | undefined;
        if (key && !nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSuccessMessage("Document record is valid and ready to be submitted.");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Document Basics</h2>
        <p className="mt-1 text-sm text-neutral-600">Core classification and file details.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Document Category</span>
            <select
              value={values.document_category}
              onChange={(event) => handleChange("document_category", event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            >
              {documentCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            {errors.document_category ? <p className="text-xs text-red-600">{errors.document_category}</p> : null}
          </label>
          <InputField label="Document Type" name="document_type" value={values.document_type} onChange={handleChange} error={errors.document_type} />
          <InputField label="Document Status" name="document_status" value={values.document_status} onChange={handleChange} error={errors.document_status} placeholder="Active / Expiring / Expired" />
          <InputField label="Document Title" name="document_title" value={values.document_title} onChange={handleChange} error={errors.document_title} />
          <InputField label="File Name" name="file_name" value={values.file_name} onChange={handleChange} error={errors.file_name} placeholder="my-file.pdf" />
          <InputField label="Visibility Level" name="visibility_level" value={values.visibility_level} onChange={handleChange} error={errors.visibility_level} placeholder="HR_ONLY / INTERNAL" />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">References</h2>
        <p className="mt-1 text-sm text-neutral-600">Link this document to related domain records.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Employee ID" name="employee_id" value={values.employee_id} onChange={handleChange} error={errors.employee_id} />
          <InputField label="Contract ID" name="contract_id" value={values.contract_id} onChange={handleChange} error={errors.contract_id} />
          <InputField label="Leave Transaction ID" name="leave_transaction_id" value={values.leave_transaction_id} onChange={handleChange} error={errors.leave_transaction_id} />
          <InputField label="Gratuity Calculation ID" name="gratuity_calculation_id" value={values.gratuity_calculation_id} onChange={handleChange} error={errors.gratuity_calculation_id} />
          <InputField label="File Movement ID" name="file_movement_id" value={values.file_movement_id} onChange={handleChange} error={errors.file_movement_id} />
        </div>
      </section>

      <section className={sectionClassName}>
        <h2 className="text-lg font-semibold text-neutral-900">Dates & Notes</h2>
        <p className="mt-1 text-sm text-neutral-600">Important lifecycle dates and context.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <InputField label="Document Date" name="document_date" type="date" value={values.document_date} onChange={handleChange} error={errors.document_date} />
          <InputField label="Issued Date" name="issued_date" type="date" value={values.issued_date} onChange={handleChange} error={errors.issued_date} />
          <InputField label="Expiry Date" name="expiry_date" type="date" value={values.expiry_date} onChange={handleChange} error={errors.expiry_date} />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Document Description</span>
            <textarea
              rows={3}
              value={values.document_description ?? ""}
              onChange={(event) => handleChange("document_description", event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
          </label>
          <label className="space-y-2">
            <span className="text-sm font-medium text-neutral-700">Notes</span>
            <textarea
              rows={3}
              value={values.notes ?? ""}
              onChange={(event) => handleChange("notes", event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500 focus:ring-2 focus:ring-neutral-200"
            />
          </label>
        </div>
      </section>

      <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm ring-1 ring-neutral-200">
        <p className="text-sm text-neutral-600">Required fields are validated before submission.</p>
        <button type="submit" className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-neutral-800">
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
