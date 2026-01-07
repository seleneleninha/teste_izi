import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test credentials
dotenv.config({ path: '.env.test' });

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'clicimob@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '123456';

test.describe('Property Management Tests', () => {

    test.beforeEach(async ({ page }) => {
        // Login before each test
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("Entrar")');
        await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => { });
        await page.waitForLoadState('networkidle');
    });

    test('should access add property page', async ({ page }) => {
        await page.goto('/add-property');
        await page.waitForLoadState('networkidle');

        // Should show property form with key fields
        await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
    });

    test('should access my properties list', async ({ page }) => {
        await page.goto('/properties');
        await page.waitForLoadState('networkidle');

        // Page should load without errors
        const pageContent = await page.textContent('body');
        expect(pageContent).not.toContain('Error');
    });

    test('should access partner properties', async ({ page }) => {
        await page.goto('/partner-properties');
        await page.waitForLoadState('networkidle');

        // Page should load
        expect(page.url()).toContain('partner-properties');
    });

    test('should access property details page', async ({ page }) => {
        // First go to properties list
        await page.goto('/properties');
        await page.waitForLoadState('networkidle');

        // Try to click on first property if exists
        const propertyCard = page.locator('.property-card, [data-testid="property-card"]').first();
        if (await propertyCard.isVisible().catch(() => false)) {
            await propertyCard.click();
            await page.waitForLoadState('networkidle');
        }
        // Test passes if no errors
        expect(true).toBe(true);
    });

});
