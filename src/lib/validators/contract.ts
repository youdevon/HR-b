import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .max(250, "Must be 250 characters or fewer.")
  .optional()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .optional()
  .or(z.literal(""));

const optionalMoneyString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "Enter a valid amount (up to 2 decimal places).")
  .optional()
  .or(z.literal(""));

export const contractSchema = z
  .object({
    employee_id: z.string().trim().min(1, "Employee is required.").max(100),
    contract_number: z.string().trim().min(1, "Contract number is required.").max(80),
    contract_title: z.string().trim().min(1, "Contract title is required.").max(200),
    contract_type: z.string().trim().min(1, "Contract type is required.").max(80),
    contract_status: z.string().trim().min(1, "Contract status is required.").max(80),
    start_date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required in YYYY-MM-DD format."),
    end_date: optionalDate,
    effective_date: optionalDate,
    notice_period: optionalTrimmedString,
    probation_start_date: optionalDate,
    probation_end_date: optionalDate,
    renewal_due_date: optionalDate,
    department: optionalTrimmedString,
    division: optionalTrimmedString,
    job_title: optionalTrimmedString,
    work_location: optionalTrimmedString,
    salary_amount: optionalMoneyString,
    salary_frequency: optionalTrimmedString,
    allowances_summary: z.string().trim().max(1000, "Allowances summary must be 1000 characters or fewer.").optional().or(z.literal("")),
    is_gratuity_eligible: z.boolean().default(false),
    supporting_notes: z.string().trim().max(1500, "Supporting notes must be 1500 characters or fewer.").optional().or(z.literal("")),
    signed_date: optionalDate,
    issued_date: optionalDate,
    renewal_status: optionalTrimmedString,
    renewal_notes: z.string().trim().max(1500, "Renewal notes must be 1500 characters or fewer.").optional().or(z.literal("")),
  })
  .superRefine((value, ctx) => {
    if (value.start_date && value.end_date && value.end_date < value.start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["end_date"],
        message: "End date cannot be earlier than start date.",
      });
    }

    if (value.probation_start_date && value.probation_end_date && value.probation_end_date < value.probation_start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["probation_end_date"],
        message: "Probation end date cannot be earlier than probation start date.",
      });
    }
  });

export type ContractInput = z.input<typeof contractSchema>;
export type Contract = z.output<typeof contractSchema>;
