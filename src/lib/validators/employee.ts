import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .max(120, "Must be 120 characters or fewer.")
  .optional()
  .or(z.literal(""));

const optionalEmail = z
  .string()
  .trim()
  .email("Please enter a valid email address.")
  .optional()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .optional()
  .or(z.literal(""));

export const employeeSchema = z
  .object({
    employee_number: z
      .string()
      .trim()
      .max(50)
      .nullable()
      .optional()
      .or(z.literal("")),
    no_employee_number: z.boolean().optional(),
    file_number: z.string().trim().min(1, "File number is required.").max(50),
    first_name: z.string().trim().min(1, "First name is required.").max(120),
    middle_name: optionalTrimmedString,
    last_name: z.string().trim().min(1, "Last name is required.").max(120),
    preferred_name: optionalTrimmedString,
    date_of_birth: optionalDate,
    department: z.string().trim().min(1, "Department is required.").max(120),
    division: optionalTrimmedString,
    job_title: z.string().trim().min(1, "Job title is required.").max(120),
    employment_status: z.string().trim().min(1, "Employment status is required.").max(60),
    employment_type: z.string().trim().min(1, "Employment type is required.").max(60),
    hire_date: optionalDate,
    id_type: optionalTrimmedString,
    id_number: optionalTrimmedString,
    other_id_description: optionalTrimmedString,
    bir_number: optionalTrimmedString,
    work_email: optionalEmail,
    personal_email: optionalEmail,
    mobile_number: z
      .string()
      .trim()
      .max(30, "Mobile number must be 30 characters or fewer.")
      .optional()
      .or(z.literal("")),
    file_status: optionalTrimmedString,
    file_location: optionalTrimmedString,
    file_notes: z.string().trim().max(1000, "File notes must be 1000 characters or fewer.").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.id_type?.toLowerCase() === "other" && !value.other_id_description?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["other_id_description"],
        message: "Describe the ID when ID type is set to Other.",
      });
    }
  });

export type EmployeeInput = z.input<typeof employeeSchema>;
export type Employee = z.output<typeof employeeSchema>;
