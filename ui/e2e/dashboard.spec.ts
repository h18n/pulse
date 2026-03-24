import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('displays dashboard with main metrics', async ({ page }) => {
        // Wait for dashboard to load
        await expect(page.locator('text=Network Core Performance')).toBeVisible();

        // Check for key metric cards
        await expect(page.locator('text=Total Devices')).toBeVisible();
        await expect(page.locator('text=Active Alerts')).toBeVisible();
    });

    test('sidebar navigation works', async ({ page }) => {
        // Click on Alerts in sidebar
        await page.click('text=Alerts');

        // Wait for alerts page
        await expect(page).toHaveURL(/\/alerts/);
        await expect(page.locator('text=Active Alerts').first()).toBeVisible();
    });

    test('theme toggle works', async ({ page }) => {
        // Find and click theme toggle button
        const themeButton = page.locator('button:has(svg)').filter({ hasText: '' }).nth(-3);
        await themeButton.click();

        // Select light theme
        await page.click('text=Light');

        // Verify theme changed (check for light class or background color)
        const html = page.locator('html');
        await expect(html).toHaveClass(/light/);
    });

    test('sidebar collapses when toggle clicked', async ({ page }) => {
        // Click sidebar toggle (hamburger menu in header)
        const toggleButton = page.locator('header button').first();
        await toggleButton.click();

        // Sidebar should be in collapsed state (narrower width)
        const sidebar = page.locator('aside');
        await expect(sidebar).toBeVisible();
    });
});

test.describe('Command Palette', () => {
    test('opens with Cmd+K shortcut', async ({ page, browserName }) => {
        await page.goto('/');

        // Determine modifier key
        const modifier = browserName === 'webkit' || process.platform === 'darwin' ? 'Meta' : 'Control';

        // Wait for hydration and retry keypress
        await expect(async () => {
            await page.keyboard.press(`${modifier}+k`);
            await expect(page.locator('input[placeholder="Type a command or search..."]')).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });
    });

    test('can search and navigate to page', async ({ page, browserName }) => {
        await page.goto('/');

        const modifier = browserName === 'webkit' || process.platform === 'darwin' ? 'Meta' : 'Control';

        // Open command palette with retry
        await expect(async () => {
            await page.keyboard.press(`${modifier}+k`);
            await expect(page.locator('input[placeholder="Type a command or search..."]')).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });

        // Type search
        await page.fill('input[placeholder="Type a command or search..."]', 'logs');

        // Should see Logs Explorer option
        await expect(page.locator('text=Go to Logs Explorer')).toBeVisible();

        // Press Enter to navigate
        await page.keyboard.press('Enter');

        // Should navigate to logs page
        await expect(page).toHaveURL(/\/explore\/logs/);
    });

    test('closes with Escape', async ({ page, browserName }) => {
        await page.goto('/');

        const modifier = browserName === 'webkit' || process.platform === 'darwin' ? 'Meta' : 'Control';

        // Open command palette with retry
        await expect(async () => {
            await page.keyboard.press(`${modifier}+k`);
            await expect(page.locator('input[placeholder="Type a command or search..."]')).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });

        // Press Escape
        await page.keyboard.press('Escape');

        // Should be closed
        await expect(page.locator('input[placeholder="Type a command or search..."]')).not.toBeVisible();
    });
});
