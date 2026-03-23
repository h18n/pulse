import { test, expect } from '@playwright/test';

test.describe('Smoke tests', () => {
    test('has title', async ({ page }) => {
        // We expect the app to load and show Pulse title
        await page.goto('/');

        // Check if the title is accurate. Adjust this if the title is different in layout.tsx
        await expect(page).toHaveTitle(/Pulse/i);
    });

    test('login page elements', async ({ page }) => {
        await page.goto('/login');

        // Ensure the login form renders
        await expect(page.locator('text=Welcome to Pulse')).toBeVisible();
        await expect(page.locator('button:has-text("GitHub")')).toBeVisible();
    });
});
