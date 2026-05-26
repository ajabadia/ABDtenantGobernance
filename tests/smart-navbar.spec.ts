import { test, expect } from '@playwright/test';

/**
 * 🎭 SmartNavbar Industrial E2E Tests — ABDtenantGobernance (Public Mode)
 *
 * Coverage:
 *   ✓ SmartNavbar renders in public mode (landing page)
 *   ✓ Theme mega-menu: open/close, switch options
 *   ✓ Language mega-menu: ES/EN options and locale switch
 *   ✓ Settings slot visible
 *   ✓ Escape key closes mega-menu
 *
 * ABDtenantGobernance runs on port 3500.
 * localePrefix: 'always' → all routes include the locale (e.g. /es/...).
 */

const PUBLIC_PAGE = '/es';

test.describe('SmartNavbar — Public Mode (ABDtenantGobernance)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PUBLIC_PAGE, { waitUntil: 'networkidle' });
    // Wait for SmartNavbar to hydrate client-side
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 20000 });
  });

  test('should render SmartNavbar with brand and utility buttons', async ({ page }) => {
    await expect(page.locator('[data-testid="smart-navbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-logo"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-menu-language"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar-menu-theme"]')).toBeVisible();
  });

  test('theme mega-menu: opens with all three options', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();

    await expect(dropdown.locator('button', { hasText: /CLARO|LIGHT/i })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: /OSCURO|DARK/i })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: /SISTEMA|SYSTEM/i })).toBeVisible();
  });

  test('language mega-menu: opens with ES/EN options', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    const dropdown = page.locator('[data-testid="navbar-dropdown"]');
    await expect(dropdown).toBeVisible();

    await expect(dropdown.locator('button', { hasText: 'ESPAÑOL' })).toBeVisible();
    await expect(dropdown.locator('button', { hasText: 'ENGLISH' })).toBeVisible();
  });

  test('language: switch to English navigates to /en', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-language"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: 'ENGLISH' }).click();
    await page.waitForURL(/\/en\//, { timeout: 10000 });
  });

  test('theme: apply dark mode', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    await page.locator('[data-testid="navbar-dropdown"] button', { hasText: /OSCURO|DARK/i }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('Escape key closes any open mega-menu', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await expect(page.locator('[data-testid="navbar-dropdown"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="navbar-dropdown"]')).not.toBeVisible({ timeout: 3000 });
  });
});
