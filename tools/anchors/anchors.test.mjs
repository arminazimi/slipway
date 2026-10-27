import test from 'node:test';
import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { platform } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(import.meta.url), "../../..");

test('anchor checker logic', async (t) => {
  // If playwright browsers are missing, skip the tests here too
  let playwrightDir;
  if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
  else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
  else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");

  if (!existsSync(playwrightDir) && !process.env.PLAYWRIGHT_BROWSERS_PATH && !process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH) {
    t.skip("Playwright browsers not installed");
    return;
  }

  // Define a tiny Node script that uses Playwright as a library, to keep tests running in node --test
  const scriptPath = join(root, '.tmp', 'anchor-test.mjs');
  mkdirSync(join(root, '.tmp'), { recursive: true });
  const scriptContent = `
    import { chromium } from 'playwright';

    async function checkAnchorsOnPage(page) {
      return await page.evaluate(() => {
        const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
        const inPageLinks = Array.from(document.querySelectorAll('a[href^="#"]'))
          .map(el => el.getAttribute('href').substring(1))
          .filter(id => id.length > 0);

        const idCounts = {};
        for (const id of ids) {
          idCounts[id] = (idCounts[id] || 0) + 1;
        }

        const errors = [];
        for (const linkTarget of inPageLinks) {
          if (!idCounts[linkTarget]) {
            errors.push("Link target '" + linkTarget + "' does not exist on the page.");
          } else if (idCounts[linkTarget] > 1) {
            errors.push("Link target '" + linkTarget + "' has duplicate IDs (" + idCounts[linkTarget] + " found).");
          }
        }
        return Array.from(new Set(errors));
      });
    }

    async function run() {
      const browser = await chromium.launch();
      try {
        const page = await browser.newPage();

        // 1. Fixture test
        await page.setContent(\`
          <a href="#missing">Missing</a>
          <a href="#duplicate">Duplicate</a>
          <a href="#ok">OK</a>
          <div id="duplicate">1</div>
          <div id="duplicate">2</div>
          <div id="ok">3</div>
        \`);
        const fixtureErrors = await checkAnchorsOnPage(page);
        if (!fixtureErrors.includes("Link target 'missing' does not exist on the page.") ||
            !fixtureErrors.includes("Link target 'duplicate' has duplicate IDs (2 found).") ||
            fixtureErrors.length !== 2) {
          console.error("Fixture failed:", fixtureErrors);
          process.exit(1);
        }

        // 2. Built pages
        const builtPages = JSON.parse(process.env.BUILT_PAGES || '{}');
        for (const [relativePath, url] of Object.entries(builtPages)) {
          // LTR/Light
          await page.emulateMedia({ colorScheme: 'light' });
          await page.goto(url);
          const err1 = await checkAnchorsOnPage(page);
          if (err1.length > 0) {
            console.error("Anchor errors on " + relativePath + ":", err1);
            process.exit(1);
          }

          // RTL/Dark
          await page.emulateMedia({ colorScheme: 'dark' });
          await page.goto(url);
          await page.evaluate(() => {
            document.documentElement.setAttribute('dir', 'rtl');
          });
          const err2 = await checkAnchorsOnPage(page);
          if (err2.length > 0) {
            console.error("Anchor errors on " + relativePath + " (RTL/Dark):", err2);
            process.exit(1);
          }
        }
      } finally {
        await browser.close();
      }
    }

    run().catch(e => { console.error(e); process.exit(1); });
  `;
  writeFileSync(scriptPath, scriptContent);

  const result = spawnSync('node', [scriptPath], {
    cwd: root,
    stdio: 'inherit',
    env: process.env
  });

  assert.strictEqual(result.status, 0, 'Playwright test script failed');
});
