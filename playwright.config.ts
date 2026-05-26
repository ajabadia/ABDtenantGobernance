import { defineConfig, devices } from '@playwright/test';

/**
 * 🎭 Playwright Industrial Configuration — ABDtenantGobernance
 * Tests for Spaces and Tenants management, which use ConfirmDialog.
 *
 * NOTE: This app depends on ABDAuth (port 3400) for authentication.
 * Start both apps before running tests:
 *   cd ABDAuth && npm run dev    # port 3400
 *   cd ABDtenantGobernance && npm run dev  # port 3500
 */
export default defineConfig({
  testDir: './tests',
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

  /* 🚀 The dev server must be started manually alongside ABDAuth.
     webServer is NOT configured here because this app requires
     ABDAuth (port 3400) to also be running for authentication. */
});
