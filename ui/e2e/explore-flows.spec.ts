import { test, expect } from '@playwright/test';

test.describe('Explore Data Flows', () => {

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

        await page.goto('/explore');
    });

    test('should navigate through Logs Explorer', async ({ page }) => {
        // 1. Verify Explore page
        await expect(page.locator('h1')).toContainText('Explore');

        // 2. Click Logs Explorer card
        await page.click('text=Logs Explorer');
        await page.waitForURL('**/explore/logs');

        // 3. Verify Logs Explorer page
        await expect(page.locator('h1')).toContainText('Logs Explorer');

        // 4. Test Search
        const searchInput = page.getByPlaceholder(/Search logs by message/i);
        await searchInput.fill('ERROR');

        // 5. Verify log list renders
        const logRows = page.locator('div.group');
        await expect(logRows.first()).toBeVisible();

        // 6. Expand a log entry
        await logRows.first().click();
        await expect(page.locator('text=Full Timestamp:')).toBeVisible();

        // 7. Test Level Toggle (Toggle ERROR)
        const errorBadge = page.getByRole('button', { name: /ERROR/i });
        await errorBadge.click(); // Deselect
        await expect(errorBadge).not.toHaveClass(/bg-red-500\/10/);

        // 8. Go back
        await page.click('button >> svg.lucide-arrow-left');
        await page.waitForURL('**/explore');
    });

    test('should navigate through Metrics Explorer', async ({ page }) => {
        await page.click('text=Metrics Explorer');
        await page.waitForURL('**/explore/metrics');

        await expect(page.locator('h1')).toContainText('Metrics Explorer');
        await expect(page.locator('button:has-text("Run Query")')).toBeVisible();
    });
});
