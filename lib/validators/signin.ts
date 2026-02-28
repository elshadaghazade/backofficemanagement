import { z } from 'zod';
import type { UserRole } from '../generated/prisma/enums';

export const SignInSchema = z.object({
  email: z
    .email('email is wrong')
    .trim()
    .toLowerCase()
    .min(1, 'email is required')
    .max(255, 'email must be at most 255 symbols'),

  password: z
    .string()
    .min(1, 'password is required')
    .max(128, 'password must be at most 128 symbols'),
});

export type SignInRequestPayloadType = z.infer<typeof SignInSchema>;
export type SignInResponseType = {
    accessToken: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        role: UserRole;
    };
}