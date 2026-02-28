import { config } from '@/config';
import { Redis, RedisOptions } from 'ioredis';

const REDIS_URL = config.db.redis.url;

const options: RedisOptions = {
  retryStrategy(times: number) {
    const delay = Math.min(times * 200, 10_000);
    console.warn(`[Redis] reconnect attempt #${times}, waiting ${delay}ms`);
    return delay;
  },
  keepAlive: 30_000
};

declare global {
  var __redis: Redis | undefined;
}

const createRedisClient = (): Redis => {
  const client = new Redis(REDIS_URL, options);

  client.on('connect', () => {
    console.info('[Redis] connected');
  });

  client.on('ready', () => {
    console.info('[Redis] ready to accept commands');
  });

  client.on('error', (err: Error) => {
    console.error('[Redis] error:', err.message);
  });

  client.on('close', () => {
    console.warn('[Redis] connection closed');
  });

  client.on('reconnecting', () => {
    console.warn('[Redis] reconnecting...');
  });

  client.on('end', () => {
    console.warn('[Redis] connection ended — no more reconnects');
  });

  return client;
}

export const redis: Redis = process.env.NODE_ENV === 'production' ? createRedisClient() : (globalThis.__redis ? globalThis.__redis : createRedisClient());


  const shutdown = async (signal: string) => {
    console.info(`[Redis] received ${signal}, closing connection...`);
    await redis.quit();
    console.info('[Redis] connection closed gracefully');
  };

  process.once('SIGTERM', () => shutdown('SIGTERM'));
  process.once('SIGINT',  () => shutdown('SIGINT'));

export const redisHealthCheck = async () => {
  try {
    const result = await redis.ping();
    return result === 'PONG';
  } catch {
    return false;
  }
}

export const RedisKeys = {
  session:   (sessionId: string) => `session:${sessionId}`,
  blacklist: (jti: string)       => `blacklist:${jti}`
} as const;