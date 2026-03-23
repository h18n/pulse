"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system' | 'cerulean' | 'violet' | 'amber';

interface ThemeContextType {
    theme: Theme;
    resolvedTheme: string;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setThemeState] = useState<Theme>('dark');
    const [resolvedTheme, setResolvedTheme] = useState<string>('dark');

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') as string | null;
        const validThemes = ['dark', 'light', 'system', 'cerulean', 'violet', 'amber'];

        if (savedTheme && validThemes.includes(savedTheme)) {
            setThemeState(savedTheme as Theme);
        } else {
            setThemeState('dark');
            localStorage.setItem('theme', 'dark');
        }
    }, []);

    useEffect(() => {
        const root = document.documentElement;

        const clearThemes = () => {
            root.classList.remove('light', 'dark', 'cerulean', 'violet', 'amber');
        };

        const applyTheme = (targetTheme: string) => {
            clearThemes();
            root.classList.add(targetTheme);

            // Add base dark/light class for custom themes
            if (['cerulean', 'violet', 'amber', 'dark'].includes(targetTheme)) {
                root.classList.add('dark');
            } else {
                root.classList.add('light');
            }

            setResolvedTheme(targetTheme);
        };

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches ? 'dark' : 'light');

            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            applyTheme(theme);
        }
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return (
        <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
