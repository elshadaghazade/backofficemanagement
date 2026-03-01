import { UserRole } from './generated/prisma/enums';
import { getRedis } from './redis';

const SESSION_TTL = 60 * 60 * 24;

export interface RedisSession {
    userId: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    refreshJti: string;
}

export const createRedisSession = async (sessionId: string, data: RedisSession) => {
    await getRedis().set(
        `session:${sessionId}`,
        JSON.stringify(data),
        'EX', SESSION_TTL,
    );
}

export const getRedisSession = async (sessionId: string): Promise<RedisSession | null> => {
    const raw = await getRedis().get(`session:${sessionId}`);
    return raw ? JSON.parse(raw) : null;
}

export const rotateRefreshJti = async (sessionId: string, newRefreshJti: string) => {
    const key = `session:${sessionId}`;
    const raw = await getRedis().get(key);
    if (!raw) {
        return false;
    }

    const current: RedisSession = JSON.parse(raw);
    const updated: RedisSession = { ...current, refreshJti: newRefreshJti };

    await getRedis().set(key, JSON.stringify(updated), 'KEEPTTL');
    return true;
}

export async function deleteRedisSession(...sessionIds: string[]) {
    await getRedis().del(...sessionIds.map(sessionId => `session:${sessionId}`));
}