import { test } from 'node:test';
import assert from 'node:assert';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import { join } from 'node:path';
import { checkReflow } from './run.mjs';

// Check if playwright browsers are available.
let playwrightDir;
if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");

if (!existsSync(playwrightDir)) {
  console.log("SKIP: Playwright browsers are not installed.");
} else {
  const { chromium } = await import("playwright");

  test('checkReflow function', async (t) => {
    const browser = await chromium.launch();

    await t.test('passes on a valid conforming fixture', async () => {
      const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
      const page = await context.newPage();

      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><style>body { margin: 0; padding: 0; }</style></head>
        <body>
          <div style="width: 100px; height: 100px; background: red;"></div>
          <p>Standard text that should wrap and not cause horizontal scroll.</p>
          <pre style="overflow-x: auto; width: 320px;"><code>Very long code line that forces the pre tag to scroll horizontally instead of the whole page</code></pre>
        </body>
        </html>
      `);

      const violations = await checkReflow(page);
      assert.deepStrictEqual(violations, []);
      await context.close();
    });

    await t.test('finds violations on a broken fixture', async () => {
      const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
      const page = await context.newPage();

      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><style>body { margin: 0; padding: 0; }</style></head>
        <body>
          <div id="bad-div" style="width: 500px; height: 100px; background: red;"></div>
        </body>
        </html>
      `);

      const violations = await checkReflow(page);
      assert.strictEqual(violations.length, 1);
      assert.strictEqual(violations[0].element, "div#bad-div");
      assert.strictEqual(violations[0].width, 500);
      assert.strictEqual(violations[0].right, 500);

      await context.close();
    });

    await t.test('finds violations when page has scroll due to non-scrollable table', async () => {
      const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
      const page = await context.newPage();

      // table without overflow-x: auto wrapper causing page scroll
      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><style>body { margin: 0; padding: 0; }</style></head>
        <body>
          <table style="width: 500px;">
            <tr><td>Wide Table</td></tr>
          </table>
        </body>
        </html>
      `);

      const violations = await checkReflow(page);
      assert.strictEqual(violations.length > 0, true);

      await context.close();
    });

    await t.test('passes when table is correctly wrapped in sl-table-wrapper', async () => {
      const context = await browser.newContext({ viewport: { width: 320, height: 800 } });
      const page = await context.newPage();

      await page.setContent(`
        <!DOCTYPE html>
        <html>
        <head><style>
          body { margin: 0; padding: 0; }
          .sl-table-wrapper { overflow-x: auto; width: 320px; }
        </style></head>
        <body>
          <div class="sl-table-wrapper">
            <table style="width: 500px;">
              <tr><td>Wide Table that scrolls inside wrapper</td></tr>
            </table>
          </div>
        </body>
        </html>
      `);

      const violations = await checkReflow(page);
      assert.deepStrictEqual(violations, []);

      await context.close();
    });

    // Cleanup
    test.after(async () => {
      await browser.close();
    });
  });
}
