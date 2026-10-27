import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) {
    throw new Error('SITE_URL environment variable is required');
  }
  await page.goto(siteUrl);
  await expect(page.locator('body')).toBeVisible();
});
