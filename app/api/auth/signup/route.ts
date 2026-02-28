
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signAccessToken, signRefreshToken, type TokenPayload } from '@/lib/jwt';
import { createRedisSession } from '@/lib/tokenStore';
import type { RedisSession } from '@/lib/tokenStore';
import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies';

const SignUpSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'first name must be at least 2 symbols'),

  lastName: z
    .string()
    .trim()
    .min(2, 'last name must be at least 2 symbols'),

  email: z
    .email('email is required')
    .trim()
    .toLowerCase()
    .max(255, 'email must be at most 255 characters'),

  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .max(128, 'password must be at most 128 characters')
    .regex(/[A-Z]/, 'password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'password must contain at least one number'),
});

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

  const existing = await prisma.user.findUnique({
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

  const { user, dbSession } = await prisma.$transaction(async (tx) => {
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

    const dbSession = await tx.session.create({
      data: { userId: user.id },
      select: { id: true }
    });

    return { user, dbSession };
  });

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

  const responseBody = {
    accessToken,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: 'user',
    },
  };

  const response = NextResponse.json(responseBody, { status: 201 });

  response.cookies.set('refresh_token', refreshToken, REFRESH_COOKIE_OPTIONS);
  response.cookies.set('session_active', 'true', SESSION_ACTIVE_COOKIE_OPTIONS);

  return response;
}