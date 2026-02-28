import { configureStore } from '@reduxjs/toolkit';
import { authApi } from './api/authApi';
import { dashboardApi } from './api/dashboardApi';

export const store = configureStore({
    reducer: {
        [authApi.reducerPath]: authApi.reducer,
        [dashboardApi.reducerPath]: dashboardApi.reducer,
    },
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(
        authApi.middleware,
        dashboardApi.middleware
    )
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;