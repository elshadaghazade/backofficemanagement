export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, type TokenPayload } from '@/lib/jwt';
import { createRedisSession } from '@/lib/tokenStore';
import type { RedisSession } from '@/lib/tokenStore';

const SignInSchema = z.object({
  email: z
    .email('email is wrong')
    .trim()
    .toLowerCase()
    .min(1, 'email is required')
    .max(255, 'email must be at most 255 symbols'),

  password: z
    .string()
    .min(1, 'password is required')
    .max(128, 'password must be at most 128 symbols'),
});

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 60 * 60 * 24,
} as const;

const SESSION_ACTIVE_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24,
} as const;

/**
 * @swagger
 * /api/auth/sign-in:
 *   post:
 *     summary: Sign in with email and password
 *     description: >
 *       Authenticates a user using email/password. On success, returns an access token in the JSON response,
 *       sets an HttpOnly refresh_token cookie, and sets a non-HttpOnly session_active cookie for UI state.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 1
 *                 maxLength: 128
 *                 example: S3cretP@ssw0rd
 *     responses:
 *       200:
 *         description: Successfully authenticated.
 *         headers:
 *           Set-Cookie:
 *             description: >
 *               Sets refresh_token (HttpOnly) and session_active cookies.
 *               refresh_token Path=/api/auth; session_active Path=/
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - accessToken
 *                 - user
 *             properties:
 *               accessToken:
 *                 type: string
 *                 description: JWT access token.
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               user:
 *                 type: object
 *                 required:
 *                   - id
 *                   - firstName
 *                   - lastName
 *                   - email
 *                   - role
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: clx123abc456def789ghi012
 *                   firstName:
 *                     type: string
 *                     example: Elshad
 *                   lastName:
 *                     type: string
 *                     example: Aghayev
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: user@example.com
 *                   role:
 *                     type: string
 *                     example: user
 *       400:
 *         description: Invalid JSON body.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: invalid json
 *       401:
 *         description: Invalid email or password.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: invalid email or password.
 *       403:
 *         description: User account is inactive.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: Your account is inactive. Please contact an administrator.
 *       422:
 *         description: Validation failed.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *                 - fieldErrors
 *             properties:
 *               error:
 *                 type: string
 *                 example: validation failed.
 *               fieldErrors:
 *                 type: object
 *                 additionalProperties:
 *                   type: array
 *                   items:
 *                     type: string
 *                 example:
 *                   email:
 *                     - email is required
 *                   password:
 *                     - password is required
 */

export const POST = async (req: NextRequest) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'invalid json' },
      { status: 400 },
    );
  }

  const parsed = SignInSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = z.flattenError(parsed.error).fieldErrors;

    return NextResponse.json(
      {
        error: 'validation failed.',
        fieldErrors
      },
      { status: 422 },
    );
  }

  const { email, password } = parsed.data;

  const user = await getPrisma().user.findUnique({
    where: { email },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      password: true,
      status: true,
      loginsCount: true,
    },
  });

  if (!user || !user.password) {
    return NextResponse.json(
      { error: 'invalid email or password.' },
      { status: 401 },
    )
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (!user || !passwordMatch) {
    return NextResponse.json(
      { error: 'invalid email or password.' },
      { status: 401 },
    );
  }

  if (user.status === 'inactive') {
    return NextResponse.json(
      { error: 'Your account is inactive. Please contact an administrator.' },
      { status: 403 },
    );
  }

  let dbSession: { id: string } = {
    id: ''
  };

  await getPrisma().$transaction(async tx => {
    dbSession = await tx.session.create({
      data: {
        userId: user.id
      },
      select: {
        id: true
      }
    });

    await tx.user.update({
      where: {
        id: user.id
      },
      data: {
        loginsCount: {
          increment: 1
        }
      }
    });
  });

  if (!dbSession.id) {
    return NextResponse.json(
      { error: 'invalid email or password.' },
      { status: 401 },
    )
  }

  const tokenPayload: TokenPayload = {
    userId: user.id,
    sessionId: dbSession.id,
    firstName: user.firstName,
    role: 'user',
  } as const;

  const { token: accessToken } = await signAccessToken(tokenPayload);
  const { token: refreshToken, jti: refreshJti } = await signRefreshToken(tokenPayload);

  const redisSession: RedisSession = {
    userId: user.id,
    sessionId: dbSession.id,
    firstName: user.firstName,
    role: 'user',
    refreshJti,
  };

  await createRedisSession(dbSession.id, redisSession);

  const response = NextResponse.json({
    accessToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: 'user',
    },
  },
    {
      status: 200
    });

  response.cookies.set('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
  response.cookies.set('session_active', 'true', SESSION_ACTIVE_COOKIE_OPTIONS);

  return response;
}