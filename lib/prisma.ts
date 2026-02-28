import "server-only";
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { config } from "@/config";

declare global {
    var __prisma: PrismaClient | undefined;
}

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

const adapter = new PrismaPg({ connectionString: config.db.postgres.database_url });

export const getPrisma = () => {
    if (isBuildPhase()) {
        throw new Error('prisma is requested during build phase');
    }

    const prisma = process.env.NODE_ENV === 'production' ? 
    new PrismaClient({ adapter }) : 
    (globalThis.__prisma ? globalThis.__prisma : new PrismaClient({ adapter }));

    return prisma;
}