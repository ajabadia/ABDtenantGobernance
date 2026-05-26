import { test, expect } from '@playwright/test';

/**
 * 🔬 Debug test — diagnose why SmartNavbar data-testid selectors aren't found.
 */
test('DEBUG: Dump page content to verify SmartNavbar presence', async ({ page }) => {
  // Navigate to root with timeout
  await page.goto('/', { timeout: 60000, waitUntil: 'domcontentloaded' });

  // Wait for the page to settle
  await page.waitForTimeout(5000);

  // Get the page title
  const title = await page.title();
  console.log('📌 Page title:', title);

  // Get the current URL
  const currentUrl = page.url();
  console.log('📌 Current URL:', currentUrl);

  // Check for smart-navbar
  const hasNavbar = await page.locator('[data-testid="smart-navbar"]').count();
  console.log('📌 smart-navbar count:', hasNavbar);

  // Check for navbar-logo
  const hasLogo = await page.locator('[data-testid="navbar-logo"]').count();
  console.log('📌 navbar-logo count:', hasLogo);

  // Check for any data-testid attributes
  const allTestIds = await page.locator('[data-testid]').count();
  console.log('📌 Elements with data-testid:', allTestIds);

  // List all data-testid values found
  const testIdValues = await page.locator('[data-testid]').evaluateAll(
    (els) => els.map(el => el.getAttribute('data-testid'))
  );
  console.log('📌 All data-testid values:', testIdValues);

  // Check body content for smart-navbar string
  const bodyText = await page.locator('body').innerHTML();
  const hasString = bodyText.includes('smart-navbar');
  console.log('📌 body contains "smart-navbar" string:', hasString);

  // Check body for data-testid
  const hasDataTestid = bodyText.includes('data-testid');
  console.log('📌 body contains "data-testid" string:', hasDataTestid);

  // If the navbar is not found, check the HTML structure
  if (hasNavbar === 0) {
    // Look for the outer page structure
    const containerClasses = await page.locator('div.smart-navbar').count();
    console.log('📌 div.smart-navbar count:', containerClasses);
  }
});
