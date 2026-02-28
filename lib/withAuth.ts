import { type NextRequest, NextResponse } from 'next/server';
import { validateBearerToken } from './authMiddleware';
import type { DecodedToken } from './jwt';

type AuthenticatedHandler = (
  req: NextRequest,
  user: DecodedToken,
) => Promise<Response>;

export const withAuth = (handler: AuthenticatedHandler) => {

  return async (req: NextRequest) => {
    const authorization = req.headers.get('authorization');
    const decoded = await validateBearerToken(authorization);

    if (!decoded) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return handler(req, decoded);
  }
}