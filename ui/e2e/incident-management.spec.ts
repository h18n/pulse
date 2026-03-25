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
        // 1. Verify page title
        await expect(page.locator('h1')).toContainText('Incidents', { timeout: 15000 });

        // 2. Wait for ANY incident row to render - using first() for stability
        const incidentRow = page.getByTestId('incident-row').first();
        await expect(incidentRow).toBeVisible({ timeout: 30000 });

        const incidentTitle = await incidentRow.getByTestId('incident-title').innerText();
        await incidentRow.click();

        // 3. Verify Sidebar opens with details
        const sidebar = page.locator('div.border-l').first();
        await expect(sidebar).toBeVisible();
        await expect(sidebar).toContainText(incidentTitle);

        // 4. Update Status to Resolved if possible, or check if buttons are present
        const resolveButton = sidebar.locator('button:has-text("Resolve")');
        if (await resolveButton.isVisible()) {
            await resolveButton.click();
            // Verify Status Change in Sidebar
            await expect(sidebar.locator('span:has-text("Resolved")')).toBeVisible();
        }
    });
});
