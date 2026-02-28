'use client';

import { store } from '@/store';
import type { FC, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { AuthProvider } from './AuthProvider';

const Providers: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <Provider store={store}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </Provider>
    );
}

export default Providers;