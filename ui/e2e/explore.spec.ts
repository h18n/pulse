import { test, expect } from '@playwright/test';

test.describe('Logs Explorer', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/explore/logs');
    });

    test('displays logs explorer page', async ({ page }) => {
        await expect(page.locator('text=Logs Explorer')).toBeVisible();
    });

    test('has search input', async ({ page }) => {
        const searchInput = page.getByTestId('explore-search-input');
        await expect(searchInput).toBeVisible();
    });

    test('has log level filters', async ({ page }) => {
        // Check for log level filter buttons
        await expect(page.locator('button:has-text("ERROR")').first()).toBeVisible();
        await expect(page.locator('button:has-text("WARN")').first()).toBeVisible();
        await expect(page.locator('button:has-text("INFO")').first()).toBeVisible();
    });

    test('displays log entries', async ({ page }) => {
        // Wait for logs to load or UI to be ready
        await expect(page.locator('text=service').first()).toBeVisible({ timeout: 10000 });
    });
});

test.describe('Metrics Explorer', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/explore/metrics');
    });

    test('displays metrics explorer page', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Metrics Explorer');
    });

    test('has query input', async ({ page }) => {
        // Should have a query input area
        const queryInput = page.getByPlaceholder('Enter PromQL expression...');
        await expect(queryInput).toBeVisible();
    });

    test('has time range selector', async ({ page }) => {
        // Use data-testid for the select
        const select = page.getByTestId('metrics-time-range');
        await expect(select).toBeVisible();
        await expect(select).toHaveValue('1h');
    });

    test('execute button is present', async ({ page }) => {
        await expect(page.locator('button:has-text("Execute")')).toBeVisible();
    });
});
