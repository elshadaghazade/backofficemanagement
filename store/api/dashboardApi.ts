import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';
import type { DashboardResponseType } from '@/app/api/dashboard/route';

export const dashboardApi = createApi({
  reducerPath: 'dashboardApi',
  baseQuery: axiosBaseQuery,
  endpoints: builder => ({
    getContent: builder.query<DashboardResponseType, void>({
      query: () => ({
        url: '/dashboard',
        method: 'GET'
      }),
    }),
  }),
});

export const {
  useGetContentQuery,
  useLazyGetContentQuery
} = dashboardApi;
