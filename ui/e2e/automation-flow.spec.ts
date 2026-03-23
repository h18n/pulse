import { test, expect } from '@playwright/test';

test.describe('Automation & Runbooks Flow', () => {

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

        await page.goto('/automation');
    });

    test('should create, toggle and execute a runbook', async ({ page }) => {
        const runbookName = `E2E Runbook ${Date.now()}`;

        // 1. Verify page Header
        await expect(page.locator('h1')).toContainText('Automation');

        // 2. Click Create Runbook
        await page.click('button:has-text("Create Runbook")');

        // 3. Fill Runbook Name & Description (Wait for modal)
        const nameInput = page.getByPlaceholder(/Incident Response/i);
        await expect(nameInput).toBeVisible();
        await nameInput.fill(runbookName);

        const descInput = page.getByPlaceholder(/Identify and mitigate/i);
        await descInput.fill('E2E Description');

        // 4. Submit
        await page.click('button:has-text("Create Playbook")');

        // 5. Verify it appears in the list
        await expect(page.locator(`text=${runbookName}`)).toBeVisible();

        // 6. Toggle Runbook (Disable it)
        const runbookCard = page.locator('div.bg-card').filter({ hasText: runbookName });
        await runbookCard.getByRole('button', { name: /Disable runbook/i }).click();

        // 7. Verify opacity change (ui indicator of disabled state)
        await expect(runbookCard).toHaveClass(/opacity-60/);

        // 8. Re-enable and Run
        await runbookCard.getByRole('button', { name: /Enable runbook/i }).click();
        await expect(runbookCard).not.toHaveClass(/opacity-60/);

        await runbookCard.getByRole('button', { name: /Run playbook/i }).click();

        // 9. Switch to Execution History tab
        await page.click('button:has-text("Execution History")');

        // 10. Verify execution record exists in table
        await expect(page.locator('table')).toContainText(runbookName);
        // Wait for status to be visible (should be immediate for mock)
        await expect(page.locator('text=Completed').last()).toBeVisible();
    });
});
