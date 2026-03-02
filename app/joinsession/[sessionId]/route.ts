import { 
    REFRESH_COOKIE_OPTIONS, 
    SESSION_ACTIVE_COOKIE_OPTIONS 
} from "@/app/api/auth/signin/route";
import { signRefreshToken, verifyRefreshToken } from "@/lib/jwt";
import { getPrisma } from "@/lib/prisma";
import { getRedisSession } from "@/lib/tokenStore";
import { NextRequest, NextResponse } from "next/server";

const joinToSession = async (sessionId: string, res: NextResponse) => {

    const prisma = getPrisma();

    const exists = await prisma.session.count({
        where: {
            id: sessionId,
            terminatedAt: null,
            user: {
                role: 'user',
                status: 'active'
            }
        },
        take: 1,
        skip: 0
    }) > 0;

    if (!exists) {
        return;
    }

    const session = await getRedisSession(sessionId);
    if (!session) {
        return;
    }

    const { token } = await signRefreshToken(sessionId, {
        userId: session.userId,
        sessionId,
        firstName: session.firstName,
        lastName: session.lastName,
        role: session.role
    });

    res.cookies.set('refresh_token', token ?? '', REFRESH_COOKIE_OPTIONS);
    res.cookies.set('session_active', 'true', SESSION_ACTIVE_COOKIE_OPTIONS);
}

export const GET = async (req: NextRequest, ctx: { params: Promise<{ sessionId: string }> }) => {
    const res = NextResponse.redirect(new URL('/', req.url));
    try {
        const sessionId = (await ctx.params).sessionId;
        const refreshToken = req.cookies.get('refresh_token')?.value;
        if (!refreshToken) {
            await joinToSession(sessionId, res);
        } else {
            const decoded = await verifyRefreshToken(refreshToken);
            if (!decoded) {
                await joinToSession(sessionId, res);
            }
        }
    } finally {
        return res;
    }
}