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

  test('should display app badge "GOV" next to the brand logo', async ({ page }) => {
    await expect(page.locator('[data-testid="navbar-logo"]')).toContainText('GOV');
  });

  test('hamburger toggle should not be visible on desktop viewport', async ({ page }) => {
    // The hamburger uses smart-navbar-mobile-only (display:none on md+)
    await expect(page.locator('[data-testid="navbar-mobile-toggle"]')).not.toBeVisible();
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
    await page.waitForURL(/\/en(?:$|\/)/, { timeout: 10000 });
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

  test('theme mega-menu: clicking outside closes the menu', async ({ page }) => {
    await page.locator('[data-testid="navbar-menu-theme"]').click();
    await page.locator('[data-testid="navbar-dropdown"]').waitFor({ state: 'visible' });

    // Dispatch mousedown directly to trigger handleClickOutside
    // The dropdown covers main visually, so force:true alone doesn't dispatch properly
    await page.evaluate(() =>
      document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: 10, clientY: 10 }))
    );

    // Menu should close
    await expect(page.locator('[data-testid="navbar-dropdown"]')).not.toBeVisible({ timeout: 3000 });
  });
});

// ──────────────────────────────────────────
//  Mobile Drawer Tests
// ──────────────────────────────────────────

test.describe('SmartNavbar — Mobile Drawer (ABDtenantGobernance)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/es', { waitUntil: 'networkidle' });
    await page.waitForSelector('[data-testid="smart-navbar"]', { timeout: 20000 });
  });

  test('hamburger toggle is visible on mobile viewport', async ({ page }) => {
    await expect(page.locator('[data-testid="navbar-mobile-toggle"]')).toBeVisible();
  });

  test('clicking hamburger opens and closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('mobile drawer has correct accessibility attributes', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    const drawer = page.locator('[data-testid="navbar-mobile-drawer"]');
    await expect(drawer).toHaveAttribute('role', 'dialog');
    await expect(drawer).toHaveAttribute('aria-modal', 'true');
    await expect(drawer).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  test('clicking backdrop closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    // Dispatch click on the backdrop element directly
    await page.evaluate(() => {
      const backdrop = document.querySelector('.fixed.inset-0');
      if (backdrop instanceof HTMLElement) backdrop.click();
    });
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });

  test('Escape key closes the mobile drawer', async ({ page }) => {
    await page.locator('[data-testid="navbar-mobile-toggle"]').click();
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="navbar-mobile-drawer"]')).not.toBeVisible({ timeout: 3000 });
  });
});
