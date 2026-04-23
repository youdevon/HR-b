import { z } from "zod";

const optionalText = z.string().trim().max(1000).optional().or(z.literal(""));
const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""));
const optionalAmount = z.string().trim().regex(/^\d+(\.\d{1,2})?$/).optional().or(z.literal(""));

export const compensationSchema = z
  .object({
    employee_id: z.string().trim().min(1),
    contract_id: optionalText,
    salary_amount: z.string().trim().regex(/^\d+(\.\d{1,2})?$/),
    salary_frequency: z.string().trim().min(1),
    allowance_amount: optionalAmount,
    allowance_notes: optionalText,
    currency: z.string().trim().min(1).max(10),
    effective_from: optionalDate,
    effective_to: optionalDate,
    compensation_status: z.string().trim().min(1),
    change_type: z.string().trim().min(1),
    change_reason: optionalText,
    notes: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.effective_from && value.effective_to && value.effective_to < value.effective_from) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["effective_to"],
        message: "Effective to cannot be earlier than effective from.",
      });
    }
  });

export type CompensationInput = z.input<typeof compensationSchema>;
export type Compensation = z.output<typeof compensationSchema>;
