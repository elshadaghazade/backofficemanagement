import { z } from 'zod';
import type { UserRole, UserStatus } from '../generated/prisma/enums';

export const UserListSchema = z.object({
    page: z.coerce.number().optional().default(0)
});

export type UserListRequestRequest = z.infer<typeof UserListSchema>;

export interface UserType {
    status: UserStatus;
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole | null;
    loginsCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface UsersListResponseType {
    data: UserType[];
    totalUsers: number;
    currentPage: number;
    nextPage: number;
    totalPages: number;
}