import { verifyAccessToken } from './jwt';

export const validateBearerToken = async (authHeader: string | null) => {

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '');
  return await verifyAccessToken(token);
}