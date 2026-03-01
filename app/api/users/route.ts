import { getPrisma } from "@/lib/prisma";
import { UserListSchema, UsersListResponseType } from "@/lib/validators/user-list";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";
import { z } from 'zod';

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: List users (admin only)
 *     description: Returns a paginated list of users. Pagination is fixed to 6 users per page.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Zero-based page index (0 = first page).
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Paginated users list.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - data
 *                 - total
 *                 - currentPage
 *                 - nextPage
 *                 - totalPages
 *             properties:
 *               data:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/User'
 *               total:
 *                 type: integer
 *                 description: Total number of users.
 *               currentPage:
 *                 type: integer
 *                 description: Current page (zero-based).
 *               nextPage:
 *                 type: integer
 *                 description: Next page (currentPage + 1).
 *               totalPages:
 *                 type: integer
 *                 description: Total number of pages.
 *             example:
 *               data:
 *                 - id: clx123abc456def789ghi012
 *                   firstName: Elshad
 *                   lastName: Aghayev
 *                   email: user@example.com
 *                   role: admin
 *                   status: active
 *                   loginsCount: 3
 *                   createdAt: "2026-03-01T10:00:00.000Z"
 *                   updatedAt: "2026-03-01T12:00:00.000Z"
 *               total: 12
 *               currentPage: 0
 *               nextPage: 1
 *               totalPages: 2
 *       401:
 *         description: Missing or invalid access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: unauthorized
 *       403:
 *         description: Forbidden (requires admin role).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: Forbidden
 *       500:
 *         description: Server error while listing users.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: Something went wrong
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - firstName
 *         - lastName
 *         - email
 *         - status
 *         - loginsCount
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         role:
 *           type: string
 *           nullable: true
 *           description: User role (nullable).
 *         status:
 *           type: string
 *           description: User status.
 *         loginsCount:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
export const GET = withAuth(async (req, user) => {
    try {
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const prisma = getPrisma();

        const parsed = UserListSchema.safeParse({ page: req.nextUrl.searchParams.get('page') });

        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status: 400 });
        }

        const take = 6;
        const page = parsed.data.page;

        const skip = (page >= 0 ? page : 0) * take;

        const usersCount = await prisma.user.count({
            where: {
                id: {
                    not: user.userId
                }
            }
        });
        const users = await prisma.user.findMany({
            select: {
                id: true,
                firstName: true,
                lastName: true,
                loginsCount: true,
                createdAt: true,
                updatedAt: true,
                email: true,
                role: true,
                status: true,
            },
            where: {
                id: {
                    not: user.userId
                }
            },
            orderBy: [
                {
                    firstName: 'asc',
                },
                {
                    lastName: 'asc',
                },
                {
                    loginsCount: 'desc'
                }
            ],
            take,
            skip
        });

        const totalPages = Math.ceil(usersCount / take);

        const payload = {
            data: users,
            totalUsers: usersCount,
            currentPage: page,
            nextPage: Math.min(page + 1, totalPages - 1),
            totalPages
        }

        return NextResponse.json<UsersListResponseType>(payload);
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});