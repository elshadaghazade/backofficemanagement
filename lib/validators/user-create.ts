import { z } from "zod";

export const userCreateSchema = z.object({
  firstName: z.string().trim(),
  lastName: z.string().trim(),
  email: z.email().trim(),
  password: z.string(),
});

export type UserCreateRequestType = z.input<typeof userCreateSchema>;