import { defineConfig, devices } from '@playwright/test';

/**
 * 🎭 Playwright Industrial Configuration — ABDtenantGobernance
 * Tests for Spaces and Tenants management, which use ConfirmDialog.
 *
 * NOTE: This app depends on ABDAuth (port 3400) for authentication.
 * webServer auto-starts ABDtenantGobernance. Only ABDAuth needs manual startup:
 *   cd ABDAuth && npm run dev    # port 3400
 *   cd ABDtenantGobernance && pnpm test  # auto-starts port 3500 via webServer
 */
export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global-setup',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: 'html',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3500',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3500',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
    stderr: 'pipe',
  },

  /* 🔐 ABDAuth (port 3400) must be started separately for auth-dependent tests.
     webServer only starts ABDtenantGobernance's own dev server. */
});
