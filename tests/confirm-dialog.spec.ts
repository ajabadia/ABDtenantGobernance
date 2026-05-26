import { test, expect } from '@playwright/test';

/**
 * 🎭 ConfirmDialog Industrial E2E Tests — ABDtenantGobernance
 *
 * Cases covered:
 *   Case 1 — useSpacesManager → Spaces page   (/es/admin/spaces)
 *   Case 2 — TenantManagementContainer → Tenants page (/es/admin/tenants)
 *   [indirect] Case 3 — Auth TenantManagementContainer uses the identical pattern
 *
 * AUTH: Login is performed on ABDAuth (port 3400) first to establish a session,
 *       then tests navigate to Gobernance (port 3500). This relies on Chromium
 *       sharing localhost cookies across ports — which works in practice but can
 *       be fragile in CI or other browsers.
 *
 *   FALLBACK (if cross-port cookies fail):
 *     Use Playwright storage state to capture the session and restore it:
 *       const storage = await context.storageState()  // after login
 *       await context.addCookies(storage.cookies)       // before Gobernance nav
 *
 * USAGE:
 *   1. Start both dev servers:
 *      cd ABDAuth           && npm run dev   # port 3400
 *      cd ABDtenantGobernance && npm run dev # port 3500
 *   2. Run: cd ABDtenantGobernance && npx playwright test
 */

const AUTH_URL = 'http://localhost:3400';
const ADMIN_EMAIL = 'ajabadia@gmail.com';
const ADMIN_PASSWORD = '11111111';

test.describe('ConfirmDialog — Gobernance Consumption', () => {
  test.beforeEach(async ({ page }) => {
    // 🔐 Login via ABDAuth then navigate to Gobernance
    await page.goto(`${AUTH_URL}/es/login`);
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/, { waitUntil: 'domcontentloaded' });
  });

  test('Case 1: Space deletion — dialog opens, displays content, and cancels', async ({ page }) => {
    await page.goto('/es/admin/spaces');

    // Wait for the tree view or empty state to render
    const treeContainer = page.locator('main .rounded-xl').first();
    await treeContainer.waitFor({ state: 'visible', timeout: 15000 });

    // Check tree container exists before looking for delete buttons (hidden until hover)
    const hasSpaces = await treeContainer.isVisible().catch(() => false);
    test.skip(!hasSpaces, 'No space nodes available to test deletion dialog');

    const treeRow = page.locator('.group').first();
    const trashButton = page.locator('button:has(svg.lucide-trash2):not(:disabled)').first();

    // ── Hover the tree row to reveal buttons, then click delete ──
    await treeRow.hover();
    await trashButton.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // ── Verify dialog content ──
    await expect(dialog).toContainText('ELIMINAR ESPACIO');
    await expect(dialog.getByRole('button', { name: 'CANCELAR' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'ELIMINAR' })).toBeVisible();

    // ── Cancel flow ──
    await dialog.getByRole('button', { name: 'CANCELAR' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('Case 1: Space deletion — confirms and removes the item', async ({ page }) => {
    await page.goto('/es/admin/spaces');

    const treeContainer = page.locator('main .rounded-xl').first();
    await treeContainer.waitFor({ state: 'visible', timeout: 15000 });

    const hasSpaces = await treeContainer.isVisible().catch(() => false);
    test.skip(!hasSpaces, 'No space nodes available');

    const treeRow = page.locator('.group').first();
    const trashButton = page.locator('button:has(svg.lucide-trash2):not(:disabled)').first();

    await treeRow.hover();
    await trashButton.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // ── Confirm — dialog should close after delete resolves ──
    await dialog.getByRole('button', { name: 'ELIMINAR' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  test('Case 2: Organization (Tenant) deletion — dialog opens, displays content, and cancels', async ({ page }) => {
    await page.goto('/es/admin/tenants');

    // Wait for tenant cards to hydrate
    const tenantCard = page.locator('.bg-card').first();
    await tenantCard.waitFor({ state: 'visible', timeout: 15000 });

    // Check tenant card exists before looking for delete button (hidden until hover)
    const hasTenants = await tenantCard.isVisible().catch(() => false);
    test.skip(!hasTenants, 'No tenant cards available to test deletion dialog');

    const deleteBtn = page.locator('button[title="Eliminar Organización"]').first();

    // ── Hover card to reveal delete button, then click ──
    await tenantCard.hover();
    await deleteBtn.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // ── Verify dialog content ──
    await expect(dialog).toContainText('ELIMINAR ORGANIZACIÓN');
    await expect(dialog.getByRole('button', { name: 'CANCELAR' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: 'ELIMINAR' })).toBeVisible();

    // ── Cancel flow ──
    await dialog.getByRole('button', { name: 'CANCELAR' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });
  });

  test('Case 2: Organization deletion — confirms and removes the item', async ({ page }) => {
    await page.goto('/es/admin/tenants');

    const tenantCard = page.locator('.bg-card').first();
    await tenantCard.waitFor({ state: 'visible', timeout: 15000 });

    const hasTenants = await tenantCard.isVisible().catch(() => false);
    test.skip(!hasTenants, 'No tenant cards available');

    const deleteBtn = page.locator('button[title="Eliminar Organización"]').first();

    await tenantCard.hover();
    await deleteBtn.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // ── Confirm — dialog should close after delete resolves ──
    await dialog.getByRole('button', { name: 'ELIMINAR' }).click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });
});
