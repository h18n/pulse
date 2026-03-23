import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, useTheme } from './ThemeProvider';

// Test component that uses the theme hook
function TestComponent() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    return (
        <div>
            <span data-testid="current-theme">{theme}</span>
            <span data-testid="resolved-theme">{resolvedTheme}</span>
            <button onClick={() => setTheme('dark')}>Set Dark</button>
            <button onClick={() => setTheme('light')}>Set Light</button>
            <button onClick={() => setTheme('system')}>Set System</button>
        </div>
    );
}

describe('ThemeProvider', () => {
    beforeEach(() => {
        // Clear localStorage before each test
        vi.mocked(localStorage.getItem).mockReturnValue(null);
        vi.mocked(localStorage.setItem).mockClear();

        // Reset document.documentElement classes
        document.documentElement.classList.remove('dark', 'light');
    });

    it('provides default dark theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('allows setting light theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByText('Set Light'));

        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    it('allows setting dark theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        // First set to light, then back to dark
        fireEvent.click(screen.getByText('Set Light'));
        fireEvent.click(screen.getByText('Set Dark'));

        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('allows setting system theme', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByText('Set System'));

        expect(screen.getByTestId('current-theme')).toHaveTextContent('system');
    });

    it('persists theme to localStorage', () => {
        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        fireEvent.click(screen.getByText('Set Light'));

        expect(localStorage.setItem).toHaveBeenCalledWith('theme', 'light');
    });

    it('loads theme from localStorage on mount', () => {
        vi.mocked(localStorage.getItem).mockReturnValue('light');

        render(
            <ThemeProvider>
                <TestComponent />
            </ThemeProvider>
        );

        // Theme should be loaded from localStorage
        expect(localStorage.getItem).toHaveBeenCalledWith('theme');
    });
});
