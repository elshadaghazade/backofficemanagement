import { UserRole, UserStatus } from "@/lib/generated/prisma/enums";
import { getPrisma } from "@/lib/prisma";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

const prisma = getPrisma();

export interface GetUserResponseType {
    status: UserStatus;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole | null;
    loginsCount: number;
}

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get user by ID
 *     description: Admin-only endpoint that returns a user's profile fields and login count.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [user]
 *               properties:
 *                 user:
 *                   type: object
 *                   required:
 *                     - id
 *                     - email
 *                     - firstName
 *                     - lastName
 *                     - status
 *                     - role
 *                     - loginsCount
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "clx9p4m4d0000abc123def456"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john.doe@example.com"
 *                     firstName:
 *                       type: string
 *                       example: "John"
 *                     lastName:
 *                       type: string
 *                       example: "Doe"
 *                     status:
 *                       type: string
 *                       description: User status enum (Prisma UserStatus)
 *                       example: "active"
 *                     role:
 *                       type: string
 *                       nullable: true
 *                       description: User role enum (Prisma UserRole)
 *                       example: "user"
 *                     loginsCount:
 *                       type: integer
 *                       format: int32
 *                       example: 12
 *             examples:
 *               ok:
 *                 value:
 *                   user:
 *                     id: "clx9p4m4d0000abc123def456"
 *                     email: "john.doe@example.com"
 *                     firstName: "John"
 *                     lastName: "Doe"
 *                     status: "active"
 *                     role: "user"
 *                     loginsCount: 12
 *       403:
 *         description: Forbidden (admin only)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Forbidden
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: user not found
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *             example:
 *               error: Something went wrong
 */
export const GET = withAuth(async (_req, user, ctx: { params: Promise<{ userId: string }>}) => {
    if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const userId = (await ctx.params).userId;
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                status: true,
                role: true,
                loginsCount: true
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'user not found' }, { status: 404 });
        }

        return NextResponse.json<{ user: GetUserResponseType}>({ user });
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});