import { getPrisma } from "@/lib/prisma";
import { deleteRedisSession } from "@/lib/tokenStore";
import { withAuth } from "@/lib/withAuth";
import { NextResponse } from "next/server";

export const POST = withAuth(async (_req, user, ctx: { params: Promise<{ sessionId: string }> }) => {
    try {
        if (user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const prisma = getPrisma();

        const sessionId = (await ctx.params).sessionId;

        await prisma.session.update({
            where: { id: sessionId },
            data: { terminatedAt: new Date() }
        });

        await deleteRedisSession(sessionId);

        return NextResponse.json({});
    } catch {
        return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
    }
});