import { getPrisma } from "@/lib/prisma";
import { createRedisSession } from "@/lib/tokenStore";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_req, user, ctx: { params: Promise<{ userId: string }> }) => {
    try {
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const prisma = getPrisma();

        const userId = (await ctx.params).userId;

        let session = await prisma.session.findFirst({
            where: {
                userId,
                terminatedAt: null
            },
            select: {
                id: true,
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        status: true
                    }
                }
            }
        });

        if (!session) {
            session = await prisma.session.create({
                data: {
                    userId,
                    createdAt: new Date()
                },
                select: {
                    id: true,
                    user: {
                        select: {
                            firstName: true,
                            lastName: true,
                            email: true,
                            role: true,
                            status: true
                        }
                    }
                }
            });

            if (!session) {
                throw new Error('Something went wrong');
            }
        }

        await createRedisSession(session.id, {
            userId,
            sessionId: session.id,
            firstName: session.user.firstName,
            lastName: session.user.lastName,
            role: session.user.role ?? 'user',
            refreshJti: session.id
        });

        return NextResponse.json({ sessionId: session.id });
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});