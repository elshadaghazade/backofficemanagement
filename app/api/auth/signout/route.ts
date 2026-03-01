import { getPrisma } from "@/lib/prisma";
import { deleteRedisSession } from "@/lib/tokenStore";
import { withAuth } from "@/lib/withAuth";
import { NextResponse, type NextRequest } from "next/server";

/**
 * @swagger
 * /api/auth/signout:
 *   post:
 *     summary: Sign out
 *     description: Clears auth cookies (refresh_token and session_active).
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Successfully signed out (cookies cleared).
 *         headers:
 *           Set-Cookie:
 *             description: Deletes refresh_token and session_active cookies.
 *             schema:
 *               type: string
 *               example: refresh_token=; Path=/api/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *             example: {}
 */

const prisma = getPrisma();

export const POST = withAuth(async (_, user) => {
    try {

        await prisma.session.updateMany({
            where: {
                userId: user.userId,
                terminatedAt: null
            },
            data: {
                terminatedAt: new Date()
            }
        });

        await deleteRedisSession(user.sessionId);

        const res = NextResponse.json({});
        res.cookies.delete('refresh_token');
        res.cookies.delete('session_active');
        return res;
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
    }
});