// lib/axiosBaseQuery.ts
import axios, { AxiosRequestConfig } from 'axios';
import type { BaseQueryFn } from '@reduxjs/toolkit/query';

const axiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true,
});

let inMemoryAccessToken: string | null = null;

export const setAccessToken = (token: string) => {
    inMemoryAccessToken = token;
}
export const clearAccessToken = () => {
    inMemoryAccessToken = null;
}

const refreshAccessToken = async () => {
    try {
        const res = await axios.post(
            '/api/auth/refresh',
            {},
            { withCredentials: true }
        );

        const token = res.data.accessToken as string;
        setAccessToken(token);
        return token;

    } catch {
        clearAccessToken();
        window.location.href = '/auth/signin';
        return null;
    }
}

// if access token exists then we inject it to the header on each request
axiosInstance.interceptors.request.use(config => {
    if (inMemoryAccessToken) {
        config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
    }
    return config;
});

axiosInstance.interceptors.response.use(res => res, async (error) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    // if access token is expired then we get fresh access token by refresh token
    // and inject it into header again and resend request implicitly
    if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        const newToken = await refreshAccessToken();
        if (newToken) {

            if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
            } else {
                originalRequest.headers = {
                    Authorization: `Bearer ${newToken}`
                }
            }

            return axiosInstance(originalRequest);
        }
    }

    return Promise.reject(error);
},
);

export const axiosBaseQuery: BaseQueryFn<AxiosRequestConfig, unknown, unknown> = async ({
    url,
    method = 'GET',
    data,
    params,
    headers
}) => {
    try {
        const result = await axiosInstance({
            url,
            method,
            data,
            params,
            headers
        });

        return { data: result.data };

    } catch (error: any) {
        return {
            error: {
                status: error.response?.status,
                data: error.response?.data ?? error.message,
            },
        };
    }
};