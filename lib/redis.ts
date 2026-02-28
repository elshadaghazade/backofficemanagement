import "server-only";
import { config } from "@/config";
import Redis, { type RedisOptions } from "ioredis";
import { logger } from "./logger";

const REDIS_URL = config.db.redis.url;

const options: RedisOptions = {
    retryStrategy(times) {
        const delay = Math.min(times * 200, 10_000);
        logger.warn(`[Redis] reconnect attempt #${times}, waiting ${delay}ms`);
        return delay;
    },
    keepAlive: 30_000,
};

declare global {
    var __redis: Redis | undefined;
}

const createRedisClient = (): Redis => {
    const client = new Redis(REDIS_URL, options);

    client.on("connect", () => logger.info("[Redis] connected"));
    client.on("ready", () => logger.info("[Redis] ready to accept commands"));
    client.on("error", (err: Error) => logger.error(`[Redis] error: ${err.message}`));
    client.on("close", () => logger.warn("[Redis] connection closed"));
    client.on("reconnecting", () => logger.warn("[Redis] reconnecting..."));
    client.on("end", () => logger.warn("[Redis] connection ended — no more reconnects"));

    return client;
};

const isBuildPhase = () => process.env.NEXT_PHASE === "phase-production-build";

export const getRedis = (): Redis => {
    if (isBuildPhase()) {
        throw new Error("redis is requested during build phase");
    }

    if (process.env.NODE_ENV === "production") {
        return (globalThis.__redis ??= createRedisClient());
    }

    globalThis.__redis ??= createRedisClient();
    return globalThis.__redis;
};

export const redisHealthCheck = async () => {
    try {
        const result = await getRedis().ping();
        return result === "PONG";
    } catch {
        return false;
    }
};

export const RedisKeys = {
    session: (sessionId: string) => `session:${sessionId}`,
    blacklist: (jti: string) => `blacklist:${jti}`,
} as const;