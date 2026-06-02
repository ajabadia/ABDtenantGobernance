import { test, expect, Page } from '@playwright/test';
import { getSessionCookies } from './helpers/session-cookie';

/**
 * 🎭 ConfirmDialog Industrial E2E Tests — ABDtenantGobernance
 *
 * Strategy:
 *   1. AUTH: Inject a valid `abd_session` JWT cookie (bypasses ABDAuth OAuth flow)
 *   2. DATA: Mock API calls via Playwright route interception (avoids MongoDB dependency)
 *
 * This approach:
 *   ✅ Does NOT require ABDAuth to be running
 *   ✅ Does NOT require MongoDB / seed data
 *   ✅ Tests the actual proxy middleware JWT verification
 *   ✅ Tests the ConfirmDialog component in real page contexts
 *   ✅ Fast — no server-side data fetching delays
 */

// ── Mock Data ─────────────────────────────────────────────────────────────

const MOCK_TENANTS = [
  {
    _id: 'tenant-001',
    tenantId: 'test-tenant-001',
    name: 'Test Organization',
    industry: 'Industrial',
    dbPrefix: 'test_',
    isolationStrategy: 'COLLECTION_PREFIX',
    active: true,
    customSpaceLabels: ['L01'],
    allowedApps: ['gobernanza'],
    spaceCount: 3,
  },
  {
    _id: 'tenant-002',
    tenantId: 'test-tenant-002',
    name: 'Second Organization',
    industry: 'Energy',
    dbPrefix: 'test2_',
    isolationStrategy: 'COLLECTION_PREFIX',
    active: true,
    customSpaceLabels: [],
    allowedApps: ['gobernanza'],
    spaceCount: 1,
  },
];

const MOCK_SPACES = [
  {
    _id: 'space-root-1',
    name: 'Main Campus',
    slug: 'main-campus',
    type: 'TENANT',
    tenantId: 'test-tenant-001',
    visibility: 'PUBLIC',
    isActive: true,
    materializedPath: '/main-campus',
    parentSpaceId: null,
    collaborators: [],
    ownerUserId: 'e2e-test-user',
  },
  {
    _id: 'space-child-1',
    name: 'Building A',
    slug: 'building-a',
    type: 'TENANT',
    tenantId: 'test-tenant-001',
    visibility: 'INTERNAL',
    isActive: true,
    parentSpaceId: 'space-root-1',
    materializedPath: '/main-campus/building-a',
    collaborators: [],
    ownerUserId: 'e2e-test-user',
  },
  {
    _id: 'space-child-2',
    name: 'Building B',
    slug: 'building-b',
    type: 'TENANT',
    tenantId: 'test-tenant-001',
    visibility: 'INTERNAL',
    isActive: true,
    parentSpaceId: 'space-root-1',
    materializedPath: '/main-campus/building-b',
    collaborators: [],
    ownerUserId: 'e2e-test-user',
  },
];

// ── Setup ─────────────────────────────────────────────────────────────────

async function setupPage(page: Page) {
  // 1. Inject session cookies for Gobernance (port 3500)
  const cookies = await getSessionCookies({
    domain: 'localhost',
    path: '/',
  });
  await page.context().addCookies(cookies);

  // 2. Mock API routes — avoids MongoDB dependency entirely
  await page.route('**/api/admin/tenants', async (route) => {
    const method = route.request().method();
    if (method === 'GET') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_TENANTS),
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/api/admin/spaces*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_SPACES),
    });
  });

  await page.route('**/api/admin/spaces/**', async (route) => {
    const method = route.request().method();
    if (method === 'DELETE') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Space deleted' }),
      });
    } else {
      await route.continue();
    }
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────

test.describe('ConfirmDialog — Gobernance Consumption', () => {
  test.beforeEach(async ({ page }) => {
    await setupPage(page);
  });

  test('Case 1: Space deletion — dialog opens, displays content, and cancels', async ({ page }) => {
    await page.goto('/es/admin/spaces', { waitUntil: 'networkidle' });

    // Wait for the tree container to render (the rounded-xl border container)
    const treeContainer = page.locator('.rounded-xl').first();
    await treeContainer.waitFor({ state: 'visible', timeout: 45000 });

    // Verify tree has space nodes (the main root node row)
    const firstRow = page.locator('.rounded-xl .select-none').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });

    // Hover the first row to reveal action buttons (opacity-0 → opacity-100)
    await firstRow.hover();

    // Click the trash/delete button (Trash2 icon)
    const deleteBtn = page.locator('button:has(svg.lucide-trash2)').first();
    await deleteBtn.click();

    // ── Verify dialog opens ──
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // ── Verify dialog content ──
    await expect(dialog).toContainText('ELIMINAR ESPACIO');
    await expect(dialog.getByRole('button', { name: /CANCELAR/i }).first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: /ELIMINAR/i }).first()).toBeVisible();

    // ── Cancel flow ──
    await dialog.getByRole('button', { name: /CANCELAR/i }).first().click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Case 1: Space deletion — confirms and removes the item', async ({ page }) => {
    await page.goto('/es/admin/spaces', { waitUntil: 'networkidle' });

    // Wait for the tree container
    const treeContainer = page.locator('.rounded-xl').first();
    await treeContainer.waitFor({ state: 'visible', timeout: 45000 });

    const firstRow = page.locator('.rounded-xl .select-none').first();
    await expect(firstRow).toBeVisible({ timeout: 5000 });

    // Hover → click delete
    await firstRow.hover();
    const deleteBtn = page.locator('button:has(svg.lucide-trash2)').first();
    await deleteBtn.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // ── Confirm — dialog should close after delete resolves ──
    await dialog.getByRole('button', { name: /ELIMINAR/i }).first().click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });

  test('Case 2: Child space deletion — dialog opens, displays content, and cancels', async ({ page }) => {
    await page.goto('/es/admin/spaces', { waitUntil: 'networkidle' });

    // Wait for the tree container
    const treeContainer = page.locator('.rounded-xl').first();
    await treeContainer.waitFor({ state: 'visible', timeout: 45000 });

    // The tree root is already expanded (node.depth < 1 → expanded=true)
    // Wait for child nodes to render
    const childRows = page.locator('.rounded-xl .select-none .select-none');
    await childRows.first().waitFor({ state: 'attached', timeout: 5000 });

    // Hover the first CHILD node to reveal its delete button
    const childRow = childRows.first();
    await childRow.hover();

    const deleteBtn = childRow.locator('button:has(svg.lucide-trash2)');
    await deleteBtn.click();

    // ── Verify dialog opens ──
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // ── Verify dialog content ──
    await expect(dialog).toContainText('ELIMINAR ESPACIO');
    await expect(dialog.getByRole('button', { name: /CANCELAR/i }).first()).toBeVisible();
    await expect(dialog.getByRole('button', { name: /ELIMINAR/i }).first()).toBeVisible();

    // ── Cancel flow ──
    await dialog.getByRole('button', { name: /CANCELAR/i }).first().click();
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('Case 2: Child space deletion — confirms and removes the item', async ({ page }) => {
    await page.goto('/es/admin/spaces', { waitUntil: 'networkidle' });

    // Wait for the tree container
    const treeContainer = page.locator('.rounded-xl').first();
    await treeContainer.waitFor({ state: 'visible', timeout: 45000 });

    const childRows = page.locator('.rounded-xl .select-none .select-none');
    await childRows.first().waitFor({ state: 'attached', timeout: 5000 });

    // Hover the first child node → click delete
    const childRow = childRows.first();
    await childRow.hover();

    const deleteBtn = childRow.locator('button:has(svg.lucide-trash2)');
    await deleteBtn.click();

    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // ── Confirm — dialog should close after delete resolves ──
    await dialog.getByRole('button', { name: /ELIMINAR/i }).first().click();
    await expect(dialog).not.toBeVisible({ timeout: 10000 });
  });
});
