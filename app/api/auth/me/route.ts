export const dynamic = 'force-dynamic';
import type { DecodedToken } from "@/lib/jwt";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";
/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user info from access token
 *     description: Returns decoded user info from the authenticated request (DecodedToken payload).
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully returned the authenticated user info.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - userInfo
 *             properties:
 *               userInfo:
 *                 $ref: '#/components/schemas/DecodedToken'
 *             example:
 *               userInfo:
 *                 userId: clx123abc456def789ghi012
 *                 sessionId: cls987abc654def321ghi000
 *                 firstName: Elshad
 *                 lastName: Aghayev
 *                 role: user
 *                 jti: 7a2c1d9e-7b0d-4b9e-9b1a-2b7b6c2b4f1a
 *                 exp: 1710000000
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
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *
 *   schemas:
 *     TokenPayload:
 *       type: object
 *       required:
 *         - userId
 *         - sessionId
 *         - firstName
 *         - lastName
 *         - role
 *       properties:
 *         userId:
 *           type: string
 *         sessionId:
 *           type: string
 *         firstName:
 *           type: string
 *         lastName:
 *           type: string
 *         role:
 *           type: string
 *           description: User role.
 *
 *     DecodedToken:
 *       allOf:
 *         - $ref: '#/components/schemas/TokenPayload'
 *         - type: object
 *           required:
 *             - jti
 *             - exp
 *           properties:
 *             jti:
 *               type: string
 *               description: Unique token identifier.
 *             exp:
 *               type: integer
 *               description: Expiration time (Unix timestamp, seconds).
 */

export interface AuthMeResponseType {
    userInfo: DecodedToken;
}

export const GET = withAuth(async (_, user) => {
    return NextResponse.json<AuthMeResponseType>({ userInfo: user });
})