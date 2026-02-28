import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { config } from "@/config";

declare global {
    var __prisma: PrismaClient | undefined;
}

const adapter = new PrismaPg({ connectionString: config.db.postgres.database_url });
export const prisma = process.env.NODE_ENV === 'production' ? 
    new PrismaClient({ adapter }) : 
    (globalThis.__prisma ? globalThis.__prisma : new PrismaClient({ adapter }));