import { z } from "zod";

export const leaveTypes = [
  "sick_leave",
  "vacation_leave",
  "casual_leave",
  "special_leave",
  "other_leave",
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

const optionalNumberString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid number (up to 2 decimal places).")
  .optional()
  .or(z.literal(""));

export const leaveSchema = z
  .object({
    employee_id: z.string().trim().min(1, "Employee is required.").max(100),
    leave_type: z.enum(leaveTypes, {
      errorMap: () => ({ message: "Select a valid leave type." }),
    }),
    transaction_type: z.string().trim().min(1, "Transaction type is required.").max(80),
    start_date: optionalDate,
    end_date: optionalDate,
    days: optionalNumberString,
    reason: z.string().trim().max(600, "Reason must be 600 characters or fewer.").optional().or(z.literal("")),
    status: z.string().trim().min(1, "Status is required.").max(80),
    notes: optionalTrimmedString,
    medical_certificate_required: z.boolean().default(false),
    medical_certificate_received: z.boolean().default(false),
    return_to_work_date: optionalDate,
  })
  .superRefine((value, ctx) => {
    if (value.start_date && value.end_date && value.end_date < value.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "End date cannot be earlier than start date.",
      });
    }

    if (value.medical_certificate_received && !value.medical_certificate_required) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["medical_certificate_received"],
        message: "Certificate cannot be marked received if not required.",
      });
    }
  });

export type LeaveInput = z.input<typeof leaveSchema>;
export type Leave = z.output<typeof leaveSchema>;
export type LeaveType = (typeof leaveTypes)[number];
