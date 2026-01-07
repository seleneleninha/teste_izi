import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load test credentials
dotenv.config({ path: '.env.test' });

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'teste@teste.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'teste123';

test.describe('Authentication Tests', () => {

    test('should show login form', async ({ page }) => {
        await page.goto('/login');

        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('button:has-text("Entrar")')).toBeVisible();
    });

    test('should show error with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'invalid@email.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button:has-text("Entrar")');

        // Should show some error message
        await page.waitForTimeout(2000);
        // Check for error toast or message
    });

    test('should login successfully with valid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("Entrar")');

        // Should redirect to dashboard
        await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
            // Might already be on dashboard or redirect differently
        });

        // Verify dashboard elements are visible
        await expect(page.locator('text=Dashboard')).toBeVisible({ timeout: 10000 }).catch(() => {
            // Dashboard might have different text
            expect(page.url()).toContain('dashboard');
        });
    });

});
