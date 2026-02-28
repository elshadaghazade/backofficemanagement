export const dynamic = 'force-dynamic';

import { getPrisma } from "@/lib/prisma";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

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

export const GET = withAuth(async (_, user) => {

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