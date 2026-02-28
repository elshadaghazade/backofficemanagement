import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';
import type { DashboardResponseType } from '@/app/api/dashboard/route';
import type { 
    DashboardContentPayloadRequest, 
    DashboardContentResponseType 
} from '@/lib/validators/dashboard-content';

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
    putContent: builder.mutation<DashboardContentResponseType, DashboardContentPayloadRequest>({
        query: data => ({
            url: '/dashboard',
            method: 'PUT',
            data
        })
    })
  }),
});

export const {
  useGetContentQuery,
  useLazyGetContentQuery,
  usePutContentMutation
} = dashboardApi;
