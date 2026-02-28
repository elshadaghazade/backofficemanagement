'use client';

import { type FC, type ReactNode, useEffect } from 'react';
import { setAccessToken } from '@/lib/axiosBaseQuery';

// we are keeping access token in memory variable for security reason,
// that's why on each refresh we loose access token.
// Each time when page is loaded then we have to get fresh access token
// by refresh token that we stored in cookie from server 
// if user has active session
export const AuthProvider: FC<{ children: ReactNode }> = ({ children }) => {

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/auth/refresh', {
                    method: 'POST',
                    credentials: 'include'
                });

                if (!res.ok) {
                    return;
                }

                const data = await res.json();
                if (data?.accessToken) {
                    setAccessToken(data.accessToken);
                }
            } catch { }
        })();
    }, []);

    return <>{children}</>;
}