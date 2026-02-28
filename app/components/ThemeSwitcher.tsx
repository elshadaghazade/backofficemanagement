'use client';

import { type FC, useCallback, useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@heroui/react';
import Image from 'next/image';

interface ThemeSwitcherProps {
    size?: number;
    className?: string;
}

export const ThemeSwitcher: FC<ThemeSwitcherProps> = ({
    className = '',
    size = 20
}) => {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    const isDark = resolvedTheme === 'dark';

    const toggle = useCallback(() => {
        setTheme(isDark ? 'light' : 'dark');
    }, [isDark]);

    if (!mounted) {
        return (
            <div
                className={`size-9 rounded-xl bg-transparent ${className}`}
                aria-hidden="true"
            />
        );
    }

    return (
        <div className='absolute right-[10px] top-[10px] z-1'>
            <Button
                variant="ghost"

                onPress={toggle}
                className={`size-9 p-0 rounded-full ${className}`}
            >
                {isDark ? <Image src={'/images/light-mode.svg'} width={size} height={size} alt='light mode' /> : <Image src={'/images/dark-mode.svg'} width={size} height={size} alt='dark mode' />}
            </Button>
        </div>
    );
}