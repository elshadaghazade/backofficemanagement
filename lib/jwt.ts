
import { config } from '@/config';
import { SignJWT, jwtVerify } from 'jose';
import { v4 as uuid } from 'uuid';
import type { UserRole } from './generated/prisma/client';

const ACCESS_SECRET = new TextEncoder().encode(config.jwt.access_token_secret);
const REFRESH_SECRET = new TextEncoder().encode(config.jwt.refresh_token_secret);

export interface TokenPayload {
    userId: string;
    sessionId: string;
    firstName: string;
    lastName: string;
    role: UserRole;
}

export interface DecodedToken extends TokenPayload {
    jti: string;
    exp: number;
}

export const signAccessToken = async (payload: TokenPayload) => {
    const jti = uuid();
    
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(jti)
        .setIssuedAt()
        .setExpirationTime('5m')
        .sign(ACCESS_SECRET);

    return { 
        token, 
        jti 
    }
}

export const signRefreshToken = async (sessionId: string, payload: TokenPayload) => {
    const jti = sessionId;

    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setJti(jti)
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(REFRESH_SECRET);

    return { 
        token, 
        jti 
    }
}

export const verifyAccessToken = async (token: string): Promise<DecodedToken | null> => {
    try {
        const { payload } = await jwtVerify(token, ACCESS_SECRET);
        return payload as unknown as DecodedToken;
    } catch {
        return null;
    }
}

export const verifyRefreshToken = async (token: string): Promise<DecodedToken | null> => {
    try {
        const { payload } = await jwtVerify(token, REFRESH_SECRET);
        return payload as unknown as DecodedToken;
    } catch {
        return null;
    }
}