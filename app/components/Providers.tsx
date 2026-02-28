'use client';

import { store } from '@/store';
import type { FC, ReactNode } from 'react';
import { Provider } from 'react-redux';

const Providers: FC<{ children: ReactNode }> = ({ children }) => {
    return (
        <Provider store={store}>{children}</Provider>
    );
}

export default Providers;