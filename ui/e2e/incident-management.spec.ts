import { test, expect } from '@playwright/test';

test.describe('Incident Lifecycle Flow', () => {

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

        await page.goto('/incidents');
    });

    test('should manage incident lifecycle from discovery to resolution', async ({ page }) => {
        // 1. Verify Incidents table
        await expect(page.locator('h1')).toContainText('Incidents');

        // 2. Select an active incident (mock data should be present)
        const incidentRow = page.locator('tbody tr').first();
        await expect(incidentRow).toBeVisible();

        const incidentTitle = await incidentRow.locator('td').nth(1).innerText();
        await incidentRow.click();

        // 3. Verify Sidebar opens with details
        const sidebar = page.locator('h2:has-text("Incident Details")').locator('..').locator('..');
        await expect(sidebar).toBeVisible();
        // Since the title appears in both list and sidebar, we use sidebar specifically
        await expect(sidebar.getByRole('heading', { name: incidentTitle })).toBeVisible();

        // 4. Click Automations tab
        await sidebar.click('button:has-text("Automations")');
        await expect(sidebar.getByRole('heading', { name: 'Runbooks' })).toBeVisible();

        // Execute a suggested runbook if present
        const runButton = sidebar.getByRole('button', { name: 'Execute' }).first();
        if (await runButton.isVisible()) {
            await runButton.click();
            await expect(sidebar.getByText('Execution started')).toBeVisible();
        }

        // 6. Update Incident Status to Resolved
        await sidebar.click('button:has-text("Resolved")');

        // 7. Verify Status Change in Sidebar
        await expect(sidebar.locator('span:has-text("Resolved")')).toBeVisible();
    });
});
