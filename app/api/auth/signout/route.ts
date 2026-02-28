import { NextResponse, type NextRequest } from "next/server";

/**
 * @swagger
 * /api/auth/sign-out:
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

export const POST = async (_: NextRequest) => {
    const res = NextResponse.json({});

    res.cookies.delete('refresh_token');
    res.cookies.delete('session_active');
    return res;
}