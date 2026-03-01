export const dynamic = 'force-dynamic';

import { getPrisma } from "@/lib/prisma";
import { DashboardContentSchema } from "@/lib/validators/dashboard-content";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";
import { z } from 'zod';

const prisma = getPrisma();

/**
 * @swagger
 * /api/dashboard:
 *   get:
 *     summary: Get active home page content
 *     description: Returns the HTML content for the currently active home page.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully returned home page content.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - content
 *               properties:
 *                 content:
 *                   type: string
 *                   description: HTML string for the active home page (falls back to `<div></div>` if none).
 *             example:
 *               content: "<div><h1>Welcome</h1><p>Home page content</p></div>"
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
 *       500:
 *         description: Server error while fetching home page content.
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
 */

export interface DashboardResponseType {
    content: string;
}

export const GET = withAuth(async (_req, _user) => {

    try {
        const homePage = await prisma.homePage.findFirst({
            where: {
                isActive: true
            },
            select: {
                content: true
            }
        });

        return NextResponse.json<DashboardResponseType>({
            content: homePage?.content ?? '<div></div>'
        });
    } catch {
        return NextResponse.json({ error: 'Something went wrong'}, { status: 500 });
    }
})

/**
 * @swagger
 * /api/dashboard:
 *   put:
 *     summary: Update active home page content (admin only)
 *     description: >
 *       Creates or updates the currently active home page record. Requires an authenticated admin user.
 *     tags:
 *       - Dashboard
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: HTML string to save as home page content.
 *                 example: "<div><h1>Dashboard</h1><p>Hello</p></div>"
 *     responses:
 *       200:
 *         description: Successfully saved home page content.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Saved HTML content (falls back to `<div></div>`).
 *             example:
 *               content: "<div><h1>Dashboard</h1></div>"
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
 *       422:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 description: Zod treeified validation error.
 *                 type: object
 *                 additionalProperties: true
 *       500:
 *         description: Server error while saving home page content.
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
 */

export const PUT = withAuth(async (req, user) => {
    if (user.role !== 'admin') {
        return NextResponse.json({ error: 'Forbidden'}, { status: 403 })
    }

    try {
        const payload = await req.json();
        const parsed = DashboardContentSchema.safeParse(payload);
        if (!parsed.success) {
            return NextResponse.json({ error: z.treeifyError(parsed.error) }, { status : 400 })
        }

        const homePage = await prisma.homePage.findFirst({
            where: {
                isActive: true
            },
            select: {
                id: true
            }
        });
        
        if (homePage) {
            await prisma.homePage.update({
                where: {
                    id: homePage.id
                },
                data: {
                    content: parsed.data.content,
                    updatedAt: new Date()
                }
            });
        } else {
            await prisma.homePage.create({
                data: {
                    content: parsed.data.content,
                    isActive: true,
                    createdAt: new Date()
                }
            });
        }

        return NextResponse.json<DashboardResponseType>({ content: parsed.data.content ?? '<div></div>' });
    } catch {
        return NextResponse.json({ error: 'Something went wrong'}, { status: 500 })
    }
});