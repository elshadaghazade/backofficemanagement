import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
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

  const user = await prisma.user.findUnique({
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

  await prisma.$transaction(async tx => {
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