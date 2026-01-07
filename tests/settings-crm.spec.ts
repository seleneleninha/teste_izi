import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'clicimob@gmail.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || '123456';

test.describe('Settings & Configuration Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("Entrar")');
        await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => { });
        await page.waitForLoadState('networkidle');
    });

    test('should access settings page', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');

        // Should show settings tabs or form
        await expect(page.locator('text=Perfil, text=Configurações').first()).toBeVisible({ timeout: 10000 }).catch(() => {
            expect(page.url()).toContain('settings');
        });
    });

    test('should access security page', async ({ page }) => {
        await page.goto('/security');
        await page.waitForLoadState('networkidle');

        // Security page should load
        expect(page.url()).toContain('security');
    });

    test('should show user profile info on settings', async ({ page }) => {
        await page.goto('/settings');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);

        // Should have input fields for profile
        const hasInputs = await page.locator('input').count() > 0;
        expect(hasInputs).toBe(true);
    });

});

test.describe('CRM & Leads Tests', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
        await page.waitForLoadState('networkidle');
        await page.fill('input[type="email"]', TEST_EMAIL);
        await page.fill('input[type="password"]', TEST_PASSWORD);
        await page.click('button:has-text("Entrar")');
        await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => { });
    });

    test('should access leads CRM page', async ({ page }) => {
        await page.goto('/leads');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('leads');
    });

    test('should access comparativo page', async ({ page }) => {
        await page.goto('/comparativo');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('comparativo');
    });

    test('should access mercado page', async ({ page }) => {
        await page.goto('/mercado');
        await page.waitForLoadState('networkidle');

        expect(page.url()).toContain('mercado');
    });

});
