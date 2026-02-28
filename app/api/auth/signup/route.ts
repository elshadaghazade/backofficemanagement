
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { getPrisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, type TokenPayload } from '@/lib/jwt';
import { createRedisSession } from '@/lib/tokenStore';
import type { RedisSession } from '@/lib/tokenStore';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';
import { type SignUpResponseType, SignUpSchema } from '@/lib/validators/signup';

const REFRESH_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 60 * 60 * 24,
} as const;

const SESSION_ACTIVE_COOKIE_OPTIONS: Partial<ResponseCookie> = {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24,
} as const;

/**
 * @swagger
 * /api/auth/sign-up:
 *   post:
 *     summary: Sign up (create account)
 *     description: >
 *       Creates a new user account. On success, returns an access token in the JSON response,
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
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *             properties:
 *               firstName:
 *                 type: string
 *                 minLength: 2
 *                 example: Elshad
 *               lastName:
 *                 type: string
 *                 minLength: 2
 *                 example: Aghayev
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 maxLength: 128
 *                 description: Must contain at least one uppercase letter and one number.
 *                 example: S3cretPass
 *     responses:
 *       201:
 *         description: Successfully created user and session.
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
 *       409:
 *         description: User already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               required:
 *                 - error
 *             properties:
 *               error:
 *                 type: string
 *                 example: user exists
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
 *                 description: Zod validation details (flattened error object).
 *                 additionalProperties: true
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

  const parsed = SignUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'validation failed.',
        fieldErrors: z.flattenError(parsed.error)
      },
      { status: 422 },
    );
  }

  const { firstName, lastName, email, password } = parsed.data;

  const existing = await getPrisma().user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existing) {
    return NextResponse.json(
      { error: 'user exists' },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const { user, dbSession } = await getPrisma().$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: passwordHash,
        status: 'active',
        loginsCount: 1,
      },
    });

    let dbSession = await tx.session.findFirst({
      where: {
        userId: user.id
      },
      select: {
        id: true
      }
    });

    if (!dbSession) {
      dbSession = await tx.session.create({
        data: {
          userId: user.id
        },
        select: {
          id: true
        }
      });
    }

    return { user, dbSession };
  });

  const tokenPayload: TokenPayload = {
    userId: user.id,
    sessionId: dbSession.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: 'user',
  } as const;

  const { token: accessToken } = await signAccessToken(tokenPayload);
  const { token: refreshToken, jti: refreshJti } = await signRefreshToken(dbSession.id, tokenPayload);

  const redisSession: RedisSession = {
    userId: user.id,
    sessionId: dbSession.id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: 'user',
    refreshJti,
  };

  await createRedisSession(dbSession.id, redisSession);

  const response = NextResponse.json<SignUpResponseType>({
    accessToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: 'user',
    },
  }, { status: 201 });

  response.cookies.set('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
  response.cookies.set('session_active', 'true', SESSION_ACTIVE_COOKIE_OPTIONS);

  return response;
}