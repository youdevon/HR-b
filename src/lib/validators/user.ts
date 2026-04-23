import { z } from "zod";

const optionalText = z.string().trim().max(120).optional().or(z.literal(""));

export const userSchema = z.object({
  full_name: z.string().trim().min(1).max(120),
  first_name: z.string().trim().min(1).max(120),
  last_name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  phone_number: optionalText,
  role_id: z.string().trim().min(1).max(80),
  account_status: z.string().trim().min(1).max(80),
  is_active: z.boolean().default(true),
});

export type UserInput = z.input<typeof userSchema>;
export type User = z.output<typeof userSchema>;
