import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';
import type{ 
  UserListRequestRequest, 
  UsersListResponseType 
} from '@/lib/validators/user-list';
import type { UserCreateRequestType } from '@/lib/validators/user-create';
import type { UserUpdateRequestType } from '@/lib/validators/user-update';
import { GetUserResponseType } from '@/app/api/users/[userId]/route';
import type { UserSessionListRequestType, UserSessionListResponseType } from '@/lib/validators/user-session-list';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: axiosBaseQuery,
  endpoints: builder => ({
    usersList: builder.query<UsersListResponseType, UserListRequestRequest>({
      query: (params) => ({
        url: '/users',
        method: 'GET',
        params
      }),
    }),
    removeUser: builder.mutation<{}, string>({
      query: (userId) => ({
        url: `/users/remove/${userId}`,
        method: 'DELETE'
      })
    }),
    createUser: builder.mutation<{}, UserCreateRequestType>({
      query: data => ({
        url: '/users/create',
        method: 'POST',
        data
      })
    }),
    updateUser: builder.mutation<{}, { userId: string, data: UserUpdateRequestType}>({
      query: payload => ({
        url: `/users/update/${payload.userId}`,
        method: 'PATCH',
        data: payload.data
      })
    }),
    getUser: builder.query<{ user: GetUserResponseType }, string>({
      query: userId => ({
        url: `/users/${userId}`,
        method: 'GET'
      })
    }),
    sessions: builder.query<UserSessionListResponseType, UserSessionListRequestType>({
      query: params => ({
        url: '/users/sessions',
        method: 'GET',
        params
      })
    }),
    terminateSession: builder.mutation<{}, string>({
      query: sessionId => ({
        url: `/users/sessions/terminate/${sessionId}`,
        method: 'POST'
      })
    }),
    createSession: builder.mutation<{ sessionId: string }, string>({
      query: userId => ({
        url: `/users/sessions/create/${userId}`,
        method: 'POST'
      })
    }),
  }),
});

export const {
  useLazyUsersListQuery,
  useUsersListQuery,
  useRemoveUserMutation,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetUserQuery,
  useLazyGetUserQuery,
  useSessionsQuery,
  useLazySessionsQuery,
  useTerminateSessionMutation,
  useCreateSessionMutation
} = userApi;
