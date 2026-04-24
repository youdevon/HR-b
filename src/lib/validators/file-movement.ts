import { z } from "zod";

export const movementStatuses = [
  "with_hr",
  "transferred",
  "in_transit",
  "received",
  "archived",
  "missing",
  "returned",
] as const;

const optionalTrimmedString = z
  .string()
  .trim()
  .max(600, "Must be 600 characters or fewer.")
  .optional()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format.")
  .optional()
  .or(z.literal(""));

export const fileMovementSchema = z
  .object({
    employee_id: z.string().trim().min(1, "Employee is required.").max(100),
    file_number: z.string().trim().min(1, "File number is required.").max(80),
    from_department: optionalTrimmedString,
    to_department: optionalTrimmedString,
    from_location: optionalTrimmedString,
    to_location: optionalTrimmedString,
    from_custodian: optionalTrimmedString,
    to_custodian: optionalTrimmedString,
    date_sent: optionalDate,
    date_received: optionalDate,
    movement_status: z.enum(movementStatuses, {
      message: "Select a valid movement status.",
    }),
    movement_reason: z.string().trim().min(1, "Movement reason is required.").max(400),
    remarks: optionalTrimmedString,
  })
  .superRefine((value, ctx) => {
    if (value.date_sent && value.date_received && value.date_received < value.date_sent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date_received"],
        message: "Date received cannot be earlier than date sent.",
      });
    }
  });

export type FileMovementInput = z.input<typeof fileMovementSchema>;
export type FileMovement = z.output<typeof fileMovementSchema>;
