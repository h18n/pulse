import { test, expect } from '@playwright/test';

test.describe('Alert Management Flow', () => {

    test.beforeEach(async ({ page }) => {
        // Mock Auth session
        await page.route('/api/auth/session', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    user: { name: 'E2E Tester', email: 'e2e@example.com' },
                    expires: new Date(Date.now() + 3600 * 1000).toISOString(),
                }),
            });
        });

        await page.goto('/alerts');
    });

    test('should filter and view alert details', async ({ page }) => {
        // 1. Verify page title
        await expect(page.locator('h1')).toContainText('Alerts');

        // 2. Search for a specific alert
        const searchInput = page.getByPlaceholder('Search alerts by name, summary, or labels...');
        await searchInput.fill('HighCPUUsage');

        // 3. Verify only relevant alert is visible in the list
        // Use a role to be context-aware
        const alertHeading = page.getByRole('heading', { name: 'HighCPUUsage' }).first();
        await expect(alertHeading).toBeVisible();

        // 4. Click the alert to see details in sidebar (from list)
        await alertHeading.click();

        // 5. Verify sidebar details
        const sidebar = page.locator('div.border-l').first();
        await expect(sidebar).toBeVisible();

        // Use nth(1) if necessary or just a more specific locator for sidebar heading
        await expect(sidebar.locator('h3')).toContainText('HighCPUUsage');
        await expect(sidebar.locator('text=Current value: 94.5%')).toBeVisible();

        // 6. Test Filtering by Severity
        await searchInput.clear();
        await page.click('button:has-text("Critical")');

        // Verify critical alerts show up
        await expect(page.locator('h3:has-text("HighCPUUsage")').first()).toBeVisible();
        await expect(page.locator('h3:has-text("HighMemoryUsage")')).not.toBeVisible();

        // 7. Close sidebar
        await sidebar.getByLabel('Close details').click();
        await expect(sidebar).not.toBeVisible();
    });

    test('should handle "No alerts found" state', async ({ page }) => {
        const searchInput = page.getByPlaceholder('Search alerts by name, summary, or labels...');
        await searchInput.fill('NonExistentAlert123');

        await expect(page.locator('h3:has-text("No alerts found")')).toBeVisible();
    });
});
