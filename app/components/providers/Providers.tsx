'use client';

import { store } from '@/store';
import type { FC, ReactNode } from 'react';
import { Provider } from 'react-redux';
import { AuthProvider } from './AuthProvider';
import { ThemeProvider } from 'next-themes';

const Providers: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <Provider store={store}>
            <AuthProvider>
                <ThemeProvider>
                    {children}
                </ThemeProvider>
            </AuthProvider>
        </Provider>
    );
}

export default Providers;