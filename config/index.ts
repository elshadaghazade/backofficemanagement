import { z } from "zod";

export const configSchema = z.object({
    db: z.object({
        postgres: z.object({
            database: z.string().min(1),
            user: z.string().min(1),
            password: z.string().min(1),
            port: z.number().int().positive().min(1),
            database_url: z.string().min(1)
        }),
        redis: z.object({
            port: z.number().int().positive().min(1),
            url: z.url().min(1),
        }),
    }),
    jwt: z.object({
        access_token_secret: z.string().min(1),
        refresh_token_secret: z.string().min(1),
    }),
    auth: z.object({
        secret: z.string().min(1),
    }),
});

export type Config = z.infer<typeof configSchema>;

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

const _config = {
    db: {
        postgres: {
            database: process.env.POSTGRES_DB ?? '',
            user: process.env.POSTGRES_USER ?? '',
            password: process.env.POSTGRES_PASSWORD ?? '',
            port: Number(process.env.POSTGRES_PORT ?? 5432),
            database_url: process.env.DATABASE_URL ?? '',
        },
        redis: {
            port: Number(process.env.REDIS_PORT ?? 6379),
            url: process.env.REDIS_URL ?? 'redis://localhost:6379'
        }
    },
    jwt: {
        access_token_secret: process.env.ACCESS_TOKEN_SECRET ?? '',
        refresh_token_secret: process.env.REFRESH_TOKEN_SECRET ?? '',
    },
    auth: {
        secret: process.env.AUTH_SECRET ?? '',
    }
}

export const config = !isBuildPhase ? configSchema.parse(_config) : _config;