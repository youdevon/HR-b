import { z } from "zod";

const optionalText = z.string().trim().max(1000).optional().or(z.literal(""));
const optionalDate = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""));
const amount = z.string().trim().regex(/^\d+(\.\d{1,2})?$/);

export const gratuitySchema = z
  .object({
    employee_id: z.string().trim().min(1),
    contract_id: optionalText,
    gratuity_rule_id: optionalText,
    calculation_date: optionalDate,
    service_start_date: optionalDate,
    service_end_date: optionalDate,
    salary_basis_amount: amount,
    allowance_basis_amount: amount,
    total_basis_amount: amount,
    calculated_amount: amount,
    reviewed_amount: amount,
    approved_amount: amount,
    calculation_status: z.string().trim().min(1),
    override_reason: optionalText,
  })
  .superRefine((value, ctx) => {
    if (value.service_start_date && value.service_end_date && value.service_end_date < value.service_start_date) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["service_end_date"],
        message: "Service end date cannot be earlier than service start date.",
      });
    }
  });

export type GratuityInput = z.input<typeof gratuitySchema>;
export type Gratuity = z.output<typeof gratuitySchema>;
