import { z } from "zod";

export const documentCategories = [
  "Employee",
  "Contract",
  "Leave",
  "Gratuity",
  "Physical File",
  "General",
] as const;

const optionalTrimmedString = z
  .string()
  .trim()
  .max(1000, "Must be 1000 characters or fewer.")
  .optional()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .optional()
  .or(z.literal(""));

export const documentSchema = z
  .object({
    employee_id: optionalTrimmedString,
    contract_id: optionalTrimmedString,
    leave_transaction_id: optionalTrimmedString,
    gratuity_calculation_id: optionalTrimmedString,
    file_movement_id: optionalTrimmedString,
    document_category: z.enum(documentCategories, {
      errorMap: () => ({ message: "Select a valid document category." }),
    }),
    document_type: z.string().trim().min(1, "Document type is required.").max(120),
    document_title: z.string().trim().min(1, "Document title is required.").max(200),
    document_description: optionalTrimmedString,
    file_name: z.string().trim().min(1, "File name is required.").max(200),
    document_status: z.string().trim().min(1, "Document status is required.").max(80),
    document_date: optionalDate,
    issued_date: optionalDate,
    expiry_date: optionalDate,
    visibility_level: z.string().trim().min(1, "Visibility level is required.").max(80),
    notes: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    if (value.issued_date && value.expiry_date && value.expiry_date < value.issued_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["expiry_date"],
        message: "Expiry date cannot be earlier than issued date.",
      });
    }
  });

export type DocumentInput = z.input<typeof documentSchema>;
export type Document = z.output<typeof documentSchema>;
