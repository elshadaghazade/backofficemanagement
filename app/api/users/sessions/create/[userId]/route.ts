import { signRefreshToken } from "@/lib/jwt";
import { getPrisma } from "@/lib/prisma";
import { createRedisSession, deleteRedisSession } from "@/lib/tokenStore";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

const prisma = getPrisma();

export const POST = withAuth(async (_req, user, ctx: { params: Promise<{ userId: string }> }) => {
    try {
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const userId = (await ctx.params).userId;

        let session = await prisma.session.findFirst({
            where: {
                userId,
                terminatedAt: null
            },
            select: {
                id: true,
            }
        });

        if (!session) {
            session = await prisma.session.create({
                data: {
                    userId,
                    createdAt: new Date()
                }
            });

            if (!session) {
                throw new Error('Something went wrong');
            }
        }

        await createRedisSession(session.id, {
            userId,
            sessionId: session.id,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            refreshJti: session.id
        });

        return NextResponse.json({ sessionId: session.id });
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});