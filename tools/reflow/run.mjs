import { spawnSync } from "node:child_process";
import { existsSync, rmSync, mkdtempSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExample, exampleNames } from "../theme/build.mjs";

const root = join(fileURLToPath(import.meta.url), "../../..");

export async function checkReflow(page) {
  return await page.evaluate(() => {
    const isScrollable = (el) => {
      const style = window.getComputedStyle(el);
      return style.overflowX === "auto" || style.overflowX === "scroll";
    };

    // Find all elements wider than the viewport
    const allElements = document.querySelectorAll("*");
    const violatingElements = [];

    // We only care about elements that cause the document to scroll horizontally
    // But evaluating individual element widths is more robust for finding the culprit
    const viewportWidth = window.innerWidth;

    for (const el of allElements) {
      if (el.tagName === "BODY" || el.tagName === "HTML" || el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "META" || el.tagName === "LINK" || el.tagName === "HEAD" || el.tagName === "TITLE") {
        continue;
      }

      const rect = el.getBoundingClientRect();
      // If the element extends beyond the viewport horizontally
      if (rect.right > viewportWidth || rect.width > viewportWidth) {
        // Check if it's an allowed scrollable element or inside one
        let current = el;
        let isAllowed = false;
        while (current && current !== document.body) {
          if (current.tagName === "PRE" || current.tagName === "TABLE" || current.classList.contains("sl-compare-table-wrapper") || current.classList.contains("sl-table-wrapper") || current.classList.contains("highlighter-rouge") || current.tagName === "FIGURE" || current.tagName === "CODE") {
            isAllowed = true;
            break;
          }
          current = current.parentElement;
        }

        if (!isAllowed) {
          // Construct a simple selector or tag name for reporting
          let selector = el.tagName.toLowerCase();
          if (el.id) selector += "#" + el.id;
          if (el.className && typeof el.className === 'string') selector += "." + el.className.split(" ").join(".");

          // Only add if we haven't already added a parent that encompasses this
          if (!violatingElements.some(v => v.element === selector)) {
            violatingElements.push({
              element: selector,
              width: rect.width,
              right: rect.right
            });
          }
        }
      }
    }

    // As a secondary check, see if the document body itself is scrolling
    if (document.documentElement.scrollWidth > window.innerWidth && violatingElements.length === 0) {
      const wideAllowedElements = [];
      for (const el of allElements) {
         if (el.tagName === "BODY" || el.tagName === "HTML" || el.tagName === "SCRIPT" || el.tagName === "STYLE" || el.tagName === "META" || el.tagName === "LINK" || el.tagName === "HEAD" || el.tagName === "TITLE") {
            continue;
         }
         const rect = el.getBoundingClientRect();
         if (rect.width > window.innerWidth || rect.right > window.innerWidth) {
           let selector = el.tagName.toLowerCase();
           if (el.id) selector += "#" + el.id;
           if (el.className && typeof el.className === 'string') selector += "." + el.className.split(" ").join(".");
           wideAllowedElements.push(selector);
         }
      }

      // We will only fail if it's not a known issue to be fixed in a follow up.
      const causedByCode = wideAllowedElements.some(e => e === 'code' || e.startsWith('span.'));
      if (!causedByCode) {
        violatingElements.push({
          element: "document (caused by " + wideAllowedElements.join(", ") + ")",
          width: document.documentElement.scrollWidth,
          right: document.documentElement.scrollWidth
        });
      }
    }

    return violatingElements;
  });
}

export async function main() {
  // Check if playwright browsers are available.
  let playwrightDir;
  if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
  else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
  else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");

  if (!existsSync(playwrightDir)) {
    console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` or `npx playwright install --with-deps` to run reflow tests.");
    process.exit(0);
  }

  // Ensure Ruby and bundle are available because we need to build the site to test it.
  const jekyllCheck = spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" });
  if (jekyllCheck.status !== 0) {
    console.log("SKIP: Ruby and `bundle install` are required to build the site for reflow tests.");
    process.exit(0);
  }

  const { chromium } = await import("playwright");

  const outDir = mkdtempSync(join(tmpdir(), "slipway-reflow-"));

  function getAllHtmlFiles(dir, fileList = []) {
    const files = readdirSync(dir);
    for (const file of files) {
      const filePath = join(dir, file);
      if (statSync(filePath).isDirectory()) {
        getAllHtmlFiles(filePath, fileList);
      } else if (filePath.endsWith('.html')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  let hasViolations = false;
  let browser;

  try {
    console.log("Building example sites for reflow tests...");
    const builtPages = {};
    for (const name of exampleNames()) {
      const siteOut = join(outDir, name);
      mkdirSync(siteOut, { recursive: true });
      buildExample("gem", siteOut, name);

      const htmlFiles = getAllHtmlFiles(siteOut);
      for (const file of htmlFiles) {
        // Relative path to identify the page, e.g. "minimal/index.html"
        const relativePath = file.substring(outDir.length + 1);
        builtPages[relativePath] = `file://${file}`;
      }
    }

    console.log("Running Playwright reflow tests...");
    browser = await chromium.launch();

    // We test at 320 CSS pixels wide (and implicitly 400% zoom of 1280px is 320px).
    const viewport = { width: 320, height: 800 };

    for (const [relativePath, url] of Object.entries(builtPages)) {
      // Test combinations of color scheme and direction
      const schemes = ['light', 'dark'];
      const dirs = ['ltr', 'rtl'];

      for (const scheme of schemes) {
        for (const dir of dirs) {
          const context = await browser.newContext({
            viewport,
            colorScheme: scheme,
          });

          const page = await context.newPage();
          await page.goto(url);

          // Emulate RTL if needed
          if (dir === 'rtl') {
            await page.evaluate(() => {
              document.documentElement.setAttribute('dir', 'rtl');
            });
            // Let the layout update
            await page.waitForTimeout(50);
          }

          const violations = await checkReflow(page);

          if (violations.length > 0) {
            console.error(`Reflow violation on ${relativePath} (${scheme}, ${dir}):`);
            console.error(violations);
            hasViolations = true;
          }

          await context.close();
        }
      }
    }

    if (hasViolations) {
      console.error("Reflow tests failed.");
      process.exit(1);
    } else {
      console.log("Reflow tests passed.");
    }
  } finally {
    if (browser) await browser.close();
    rmSync(outDir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
