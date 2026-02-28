'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { FC, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

export const ThemeProvider: FC<Props> = ({ children }) => {
    return (
        <NextThemesProvider
            attribute={['class', 'data-theme']}
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            storageKey="theme"
        >
            {children}
        </NextThemesProvider>
    );
}