import { test, expect } from '@playwright/test';

test.describe('Logs Explorer', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/explore/logs');
    });

    test('displays logs explorer page', async ({ page }) => {
        await expect(page.locator('text=Logs Explorer')).toBeVisible();
    });

    test('has search input', async ({ page }) => {
        const searchInput = page.locator('input[placeholder*="Search"]');
        await expect(searchInput).toBeVisible();
    });

    test('has log level filters', async ({ page }) => {
        // Check for log level filter buttons
        await expect(page.locator('text=ERROR').first()).toBeVisible();
        await expect(page.locator('text=WARN').first()).toBeVisible();
        await expect(page.locator('text=INFO').first()).toBeVisible();
    });

    test('displays log entries', async ({ page }) => {
        // Wait for logs to load
        await page.waitForTimeout(1000);

        // Should have log entries in the list
        const logEntries = page.locator('[data-testid="log-entry"]');
        // Check if any log content is visible
        await expect(page.locator('text=service').first()).toBeVisible();
    });
});

test.describe('Metrics Explorer', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/explore/metrics');
    });

    test('displays metrics explorer page', async ({ page }) => {
        await expect(page.locator('text=Metrics Explorer')).toBeVisible();
    });

    test('has query input', async ({ page }) => {
        // Should have a query input area
        const queryInput = page.locator('textarea, input').first();
        await expect(queryInput).toBeVisible();
    });

    test('has time range selector', async ({ page }) => {
        // Check for time range dropdown
        await expect(page.locator('text=Last 1 hour').or(page.locator('text=1h'))).toBeVisible();
    });

    test('execute button is present', async ({ page }) => {
        await expect(page.locator('button:has-text("Execute")')).toBeVisible();
    });
});
