import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@/lib/axiosBaseQuery';
import { clearAccessToken } from '@/lib/axiosBaseQuery';
import type { 
  SignInRequestPayloadType, 
  SignInResponseType 
} from '@/lib/validators/signin';
import type { 
  SignUpRequestType, 
  SignUpResponseType 
} from '@/lib/validators/signup';

export interface RefreshResponse {
  accessToken: string;
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery,
  endpoints: builder => ({
    signIn: builder.mutation<SignInResponseType, SignInRequestPayloadType>({
      query: (body) => ({
        url: '/auth/signin',
        method: 'POST',
        data: body,
      }),
    }),

    signUp: builder.mutation<SignUpResponseType, SignUpRequestType>({
      query: (body) => ({
        url: '/auth/signup',
        method: 'POST',
        data: body,
      }),
    }),

    signOut: builder.mutation<void, void>({
      query: () => ({
        url: '/auth/signout',
        method: 'POST',
      }),
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } finally {
          clearAccessToken();
        }
      },
    }),
  }),
});

export const {
  useSignInMutation,
  useSignUpMutation,
  useSignOutMutation,
} = authApi;
