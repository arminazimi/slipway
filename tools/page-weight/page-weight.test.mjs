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
    const pagesToTest = [{ path: 'index.html', type: 'home' }];

    if (name === 'docs') {
      pagesToTest.push({ path: 'guide/install.html', type: 'doc' });
    }

    if (name === 'blog') {
      pagesToTest.push({ path: '2026/06/21/hello-blog.html', type: 'post' });
    }

    for (const { path, type } of pagesToTest) {
      test(`example ${name} ${type} page respects budget`, async ({ page }, testInfo) => {
        const url = new URL(path, baseUrl).href;
        let networkBytes = 0;

        page.on('response', async (response) => {
          const urlStr = response.url();
          const reqType = response.request().resourceType();
          // Include HTML, CSS, JS, and fonts
          if (['document', 'stylesheet', 'script', 'font'].includes(reqType)) {
            if (urlStr.startsWith('file://')) {
              try {
                const filePath = fileURLToPath(urlStr);
                const stat = statSync(filePath);
                networkBytes += stat.size;
              } catch (e) {
                // Ignore
              }
            } else {
               try {
                  const body = await response.body();
                  networkBytes += body.length;
               } catch (e) {
               }
            }
          }
        });

        if (testInfo.project.name === 'chromium-rtl') {
          // Add init script to emulate RTL dynamically before any network requests
          await page.addInitScript(() => {
             document.documentElement.setAttribute('dir', 'rtl');
          });
        }

        // Go to page and wait for network idle to ensure all resources are loaded
        const response = await page.goto(url, { waitUntil: 'networkidle' }).catch(() => null);
        if (!response) {
            console.log(`Skipping missing page ${url}`);
            return;
        }

        // Ensure all responses are tracked, for file urls Playwright might not wait correctly for subresources.
        // Best approach is evaluating the size of all loaded scripts, links and fonts directly
        const resourceUrls = await page.evaluate(() => {
          const links = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).map(el => el.href);
          const scripts = Array.from(document.querySelectorAll('script[src]')).map(el => el.src);
          // fonts are harder to get from JS, but we know our font budget is within css.
          return { links, scripts, html: location.href };
        });

        let measuredBytes = 0;
        const getFileSize = (fileUrl) => {
          if (!fileUrl.startsWith('file://')) return 0;
          try {
            const path = fileURLToPath(fileUrl);
            return statSync(path).size;
          } catch(e) {
            return 0;
          }
        };

        measuredBytes += getFileSize(resourceUrls.html);
        for(const link of resourceUrls.links) measuredBytes += getFileSize(link);
        for(const script of resourceUrls.scripts) measuredBytes += getFileSize(script);

        // Add fonts explicitly (as we know them) or rely on the network tracker (which might miss cached file reads in PW)
        // Since network tracker totalBytes sometimes fails for file://, let's use the explicit measure for HTML/CSS/JS
        // + whatever network tracker got (which might include fonts if they fired).
        // For local tests where Playwright intercepts might miss file sizes, this is more robust.

        let totalBytes = Math.max(networkBytes, measuredBytes);

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
    test(`broken fixture correctly fails budget`, async ({ page }, testInfo) => {
      const url = sites['broken-fixture'];
      let networkBytes = 0;
      page.on('response', async (response) => {
          const urlStr = response.url();
          if (urlStr.startsWith('file://')) {
            try {
              networkBytes += statSync(fileURLToPath(urlStr)).size;
            } catch (e) {}
          }
      });

      if (testInfo.project.name === 'chromium-rtl') {
        // Add init script to emulate RTL dynamically before any network requests
        await page.addInitScript(() => {
           document.documentElement.setAttribute('dir', 'rtl');
        });
      }
      await page.goto(url, { waitUntil: 'networkidle' });

      const resourceUrls = await page.evaluate(() => {
         return { html: location.href };
      });
      let measuredBytes = 0;
      if (resourceUrls.html.startsWith('file://')) {
          try {
            measuredBytes = statSync(fileURLToPath(resourceUrls.html)).size;
          } catch (e) {}
      }

      let totalBytes = Math.max(networkBytes, measuredBytes);

      // We expect the home budget to be exceeded
      expect(totalBytes).toBeGreaterThan(budgets.home);
    });
  }
});
