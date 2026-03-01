import { z } from "zod";

export const userUpdateSchema = z.object({
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
  email: z.email().trim().optional(),
  password: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional()
});

export type UserUpdateRequestType = z.input<typeof userUpdateSchema>;