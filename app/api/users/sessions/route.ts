import { getPrisma } from "@/lib/prisma";
import { type UserSessionListResponseType, UserSessionListSchema } from "@/lib/validators/user-session-list";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";
import { z } from 'zod';

/**
 * @swagger
 * /api/users/sessions:
 *   get:
 *     summary: List user sessions (paginated)
 *     description: Admin-only endpoint that returns sessions with basic user info, excluding the current admin's own session/user id.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Page index (0-based)
 *         example: 0
 *     responses:
 *       200:
 *         description: Sessions fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required: [data, totalUsers, currentPage, nextPage, totalPages]
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     required: [id, createdAt, terminatedAt, user]
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "clx9p4m4d0000abc123def456"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-03-01T10:15:30.000Z"
 *                       terminatedAt:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                         example: null
 *                       user:
 *                         type: object
 *                         required: [id, firstName, lastName, email]
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "clx9p4m4d0000abc123def111"
 *                           firstName:
 *                             type: string
 *                             example: "John"
 *                           lastName:
 *                             type: string
 *                             example: "Doe"
 *                           email:
 *                             type: string
 *                             format: email
 *                             example: "john.doe@example.com"
 *                 totalUsers:
 *                   type: integer
 *                   format: int32
 *                   example: 42
 *                 currentPage:
 *                   type: integer
 *                   format: int32
 *                   example: 0
 *                 nextPage:
 *                   type: integer
 *                   format: int32
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   format: int32
 *                   example: 7
 *             examples:
 *               ok:
 *                 value:
 *                   data:
 *                     - id: "clx9p4m4d0000abc123def456"
 *                       createdAt: "2026-03-01T10:15:30.000Z"
 *                       terminatedAt: null
 *                       user:
 *                         id: "clx9p4m4d0000abc123def111"
 *                         firstName: "John"
 *                         lastName: "Doe"
 *                         email: "john.doe@example.com"
 *                   totalUsers: 42
 *                   currentPage: 0
 *                   nextPage: 1
 *                   totalPages: 7
 *       400:
 *         description: Validation error (invalid page query param)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: object
 *             example:
 *               error:
 *                 issues:
 *                   - path: ["page"]
 *                     message: "Invalid input"
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

export const GET = withAuth(async (req, user) => {
    try {
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const prisma = getPrisma()

        const parsed = UserSessionListSchema.safeParse({ page: req.nextUrl.searchParams.get('page') });

        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
        }

        const take = 6;
        const page = parsed.data.page;

        const skip = (page >= 0 ? page : 0) * take;

        const usersCount = await prisma.session.count({
            where: {
                userId: {
                    not: user.userId
                }
            }
        });

        const sessions = await prisma.session.findMany({
            select: {
                id: true,
                createdAt: true,
                terminatedAt: true,
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            where: {
                userId: {
                    not: user.userId
                }
            },
            orderBy: [
                {
                    terminatedAt: 'desc'
                },
                {
                    createdAt: 'desc',
                },
                {
                    user: {
                        firstName: 'asc'
                    }
                },
                {
                    user: {
                        lastName: 'asc',
                    }
                },
                {
                    user: {
                        loginsCount: 'desc'
                    }
                }
            ],
            take,
            skip
        });

        const totalPages = Math.ceil(usersCount / take);

        const payload = {
            data: sessions,
            totalUsers: usersCount,
            currentPage: page,
            nextPage: Math.min(page + 1, totalPages - 1),
            totalPages
        }

        return NextResponse.json<UserSessionListResponseType>(payload);
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});