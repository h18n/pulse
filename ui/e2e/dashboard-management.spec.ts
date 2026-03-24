import { test, expect } from '@playwright/test';

test.describe('Dashboard Management Flow', () => {

    test.beforeEach(async ({ page }) => {
        // 1. Mock session info (client side)
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

        // 2. Mock dashboard list
        await page.route('/api/dashboards', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({
                    status: 200,
                    contentType: 'application/json',
                    body: JSON.stringify({
                        dashboards: [
                            { id: 'dash-1', title: 'System Overview', tags: ['prod'], updatedAt: new Date().toISOString() },
                        ],
                        folders: []
                    }),
                });
            } else if (route.request().method() === 'POST') {
                await route.fulfill({
                    status: 201,
                    contentType: 'application/json',
                    body: JSON.stringify({ id: 'new-dashboard-1', title: 'E2E Dashboard' }),
                });
            }
        });

        // 3. Mock single dashboard fetch (for the new dashboard)
        await page.route('**/api/dashboards/new-dashboard-1', async (route) => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    id: 'new-dashboard-1',
                    title: 'E2E Dashboard',
                    description: 'E2E Test Description',
                    panels: [],
                    layouts: { lg: [], md: [] },
                    tags: [],
                    refreshInterval: 30000,
                }),
            });
        });
    });

    test('should manage a dashboard journey from creation to saving', async ({ page }) => {
        // Go to dashboards list
        await page.goto('/dashboards');

        // 1. Initiate "New Dashboard"
        await page.click('button:has-text("New Dashboard")');
        await page.waitForURL('**/dashboards/new');

        // 2. Fill the creation form
        await page.locator('input[placeholder*="My Dashboard"]').fill('E2E Dashboard');
        await page.locator('textarea[placeholder*="Optional description"]').fill('E2E Test Description');
        await page.click('button:has-text("Create Dashboard")');

        // 3. Wait for redirect and check title
        await page.waitForURL('**/dashboards/new-dashboard-1**');
        await expect(page.locator('h1')).toContainText(/E2E Dashboard/i);

        // 4. Test Add Panel
        await page.click('button:has-text("Add Panel")');
        await expect(page.locator('text=Configure Panel')).toBeVisible();
        await page.click('button:has-text("Create Panel")');

        // 5. Save the dashboard
        await page.click('button:has-text("Save")');
        await expect(page.locator('text=Dashboard saved successfully')).toBeVisible();
    });
});
