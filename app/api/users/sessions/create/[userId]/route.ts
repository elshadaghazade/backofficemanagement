import { getPrisma } from "@/lib/prisma";
import { createRedisSession } from "@/lib/tokenStore";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_req, _user, ctx: { params: Promise<{ userId: string }> }) => {
    try {
        if (_user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const prisma = getPrisma();

        const userId = (await ctx.params).userId;

        const user = await prisma.user.findUnique({
            where: {
                id: userId,
                status: 'active',
                role: 'user'
            },
            select: { 
                id: true,
                firstName: true,
                lastName: true,
                role: true 
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'User is not active' }, { status: 403 });
        }

        let session = await prisma.session.findFirst({
            where: {
                userId,
                terminatedAt: null,
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
                },
                select: {
                    id: true
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
            role: user.role ?? 'user',
            refreshJti: session.id
        });

        return NextResponse.json({ sessionId: session.id });
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});