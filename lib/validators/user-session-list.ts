import { z } from 'zod';
import type { UserRole, UserStatus } from '../generated/prisma/enums';

export const UserSessionListSchema = z.object({
    page: z.coerce.number().optional().default(0)
});

export type UserSessionListRequestType = z.infer<typeof UserSessionListSchema>;

export interface SessionUserType {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface SessionType {
    user: SessionUserType;
    id: string;
    createdAt: Date;
    terminatedAt: Date | null;
}

export interface UserSessionListResponseType {
    data: SessionType[];
    totalUsers: number;
    currentPage: number;
    nextPage: number;
    totalPages: number;
}