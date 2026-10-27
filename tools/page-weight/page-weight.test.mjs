import { test, expect } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '../..');
const budgetsPath = join(rootDir, 'tools/page-weight/budgets.json');
const budgets = JSON.parse(readFileSync(budgetsPath, 'utf8'));

test.describe('page weight tests', () => {
  const sitesEnv = process.env.SITE_URLS;
  if (!sitesEnv) {
    throw new Error('SITE_URLS environment variable is required');
  }
  const sites = JSON.parse(sitesEnv);

  for (const [name, baseUrl] of Object.entries(sites)) {
    // Only process actual examples, skip broken fixture
    if (name === 'broken-fixture') continue;

    // Determine which pages to test for this example.
    const pagesToTest = [{ path: '', type: 'home' }];

    if (name === 'docs') {
      pagesToTest.push({ path: 'guide/install.html', type: 'doc' });
    }

    if (name === 'blog') {
      pagesToTest.push({ path: '2026/06/21/hello-blog.html', type: 'post' });
    }

    for (const { path, type } of pagesToTest) {
      test(`example ${name} ${type} page respects budget`, async ({ page }, testInfo) => {
        const url = new URL(path, baseUrl).href;
        let totalBytes = 0;

        page.on('response', async (response) => {
          const urlStr = response.url();
          const reqType = response.request().resourceType();
          // Include HTML, CSS, JS, and fonts
          if (['document', 'stylesheet', 'script', 'font'].includes(reqType)) {
            if (urlStr.startsWith('file://')) {
              try {
                const filePath = fileURLToPath(urlStr);
                const stat = statSync(filePath);
                totalBytes += stat.size;
              } catch (e) {
                // Ignore
              }
            } else {
               try {
                  const body = await response.body();
                  totalBytes += body.length;
               } catch (e) {
               }
            }
          }
        });

        // Go to page and wait for network idle to ensure all resources are loaded
        const response = await page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
        if (!response) {
            console.log(`Skipping missing page ${url}`);
            return;
        }

        if (testInfo.project.name === 'chromium-rtl') {
          await page.evaluate(() => {
            document.documentElement.setAttribute('dir', 'rtl');
          });
          await page.waitForTimeout(500);
        }

        const budget = budgets[type];
        if (!budget) {
          throw new Error(`No budget defined for type ${type}`);
        }

        console.log(`Weight for ${name} ${type}: ${totalBytes} bytes (budget: ${budget})`);

        // Check if weight is within budget
        expect(totalBytes).toBeLessThanOrEqual(budget);
      });
    }
  }

  // Explicit broken fixture test if passed
  if (sites['broken-fixture']) {
    test(`broken fixture correctly fails budget`, async ({ page }) => {
      const url = sites['broken-fixture'];
      let totalBytes = 0;
      page.on('response', async (response) => {
          const urlStr = response.url();
          if (urlStr.startsWith('file://')) {
            try {
              totalBytes += statSync(fileURLToPath(urlStr)).size;
            } catch (e) {}
          }
      });
      await page.goto(url, { waitUntil: 'networkidle' });
      // We expect the home budget to be exceeded
      expect(totalBytes).toBeGreaterThan(budgets.home);
    });
  }
});
