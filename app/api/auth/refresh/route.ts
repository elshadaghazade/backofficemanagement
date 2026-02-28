export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt';
import { deleteRedisSession, getRedisSession, rotateRefreshJti } from '@/lib/tokenStore';

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: >
 *       Exchanges a valid refresh token (stored in an HttpOnly cookie) for a new access token,
 *       rotates the refresh token JTI in Redis, and sets a new refresh_token cookie.
 *     tags:
 *       - Auth
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Successfully issued a new access token and rotated refresh token.
 *         headers:
 *           Set-Cookie:
 *             description: Sets a new HttpOnly refresh_token cookie.
 *             schema:
 *               type: string
 *               example: refresh_token=eyJ...; Path=/api/auth; HttpOnly; SameSite=Lax
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - accessToken
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: New JWT access token.
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Missing/invalid refresh token or session expired.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: session expired
 *
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: refresh_token
 */

export const POST = async (req: NextRequest) => {
  const refreshToken = req.cookies.get('refresh_token')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'no refresh token' }, { status: 401 });
  }

  const decoded = await verifyRefreshToken(refreshToken);
  if (!decoded) {
    return await clearCookiesAndUnauthorized();
  }

  const session = await getRedisSession(decoded.sessionId);
  if (!session || session.refreshJti !== decoded.jti) {
    return await clearCookiesAndUnauthorized();
  }

  const payload = {
    userId: session.userId,
    sessionId: decoded.sessionId,
    firstName: session.firstName,
    lastName: session.lastName,
    role: session.role,
  };

  const { token: newAccessToken } = await signAccessToken(payload);
  const { token: newRefreshToken, jti: newJti } = await signRefreshToken(session.sessionId, payload);

  const patched = await rotateRefreshJti(decoded.sessionId, newJti);
  if (!patched) {
    return await clearCookiesAndUnauthorized();
  }

  const response = NextResponse.json({ accessToken: newAccessToken });
  response.cookies.set('refresh_token', newRefreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/api/auth',
  });

  return response;
}

const clearCookiesAndUnauthorized = async () => {
  const res = NextResponse.json({ error: 'session expired' }, { status: 401 });
  const jti = res.cookies.get('refresh_token');

  res.cookies.delete('refresh_token');
  res.cookies.delete('session_active');
  if (jti?.value) {
    await deleteRedisSession(jti.value);
  }
  return res;
}