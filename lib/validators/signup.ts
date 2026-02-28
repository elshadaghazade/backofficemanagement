import { z } from 'zod';

export const SignUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'first name must be at least 2 symbols'),

  lastName: z
    .string()
    .trim()
    .min(2, 'last name must be at least 2 symbols'),

  email: z
    .email('email is required')
    .trim()
    .toLowerCase()
    .max(255, 'email must be at most 255 characters'),

  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(128, 'password must be at most 128 characters')
    .regex(/[A-Z]/, 'password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'password must contain at least one number'),
});

export const SignUpWithConfirmSchema = SignUpSchema.extend({
  confirmPassword: z.string().min(1, "confirm password is required"),
}).superRefine(({ password, confirmPassword }, ctx) => {
  if (password !== confirmPassword) {
    ctx.addIssue({
      code: "custom",
      path: ["confirmPassword"],
      message: "passwords do not match",
    });
  }
});

export type SignUpRequestType = z.infer<typeof SignUpSchema>;
export type SignUpResponseType = {
    accessToken: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: string;
    };
}