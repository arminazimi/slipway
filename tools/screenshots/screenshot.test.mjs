import { test, expect } from '@playwright/test';

const widths = [320, 768, 1280];
const modes = ['light', 'dark'];
const sites = [
  { name: 'minimal', urlEnv: 'MINIMAL_SITE_URL' },
  { name: 'persian', urlEnv: 'PERSIAN_SITE_URL' }
];

for (const site of sites) {
  for (const mode of modes) {
    for (const width of widths) {
      test(`${site.name} site - ${mode} mode - ${width}px width`, async ({ page }) => {
        const siteUrl = process.env[site.urlEnv];
        if (!siteUrl) {
          throw new Error(`${site.urlEnv} environment variable is required`);
        }

        // Set the viewport size
        await page.setViewportSize({ width, height: 800 });

        // Set color scheme preference
        await page.emulateMedia({ colorScheme: mode });

        // Load the page
        await page.goto(siteUrl);

        // Force the theme using data-theme to be sure
        await page.evaluate((themeMode) => {
          document.documentElement.setAttribute('data-theme', themeMode);
        }, mode);

        // Wait a little bit for fonts/layout to settle
        await page.waitForTimeout(500);

        // Take a full page screenshot and compare with baseline
        await expect(page).toHaveScreenshot(`${site.name}-${mode}-${width}.png`, {
          fullPage: true,
        });
      });
    }
  }
}
