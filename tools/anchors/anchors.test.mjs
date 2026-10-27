import { test, expect } from '@playwright/test';

// Define the core checker logic so we can test it directly on a fixture
async function checkAnchorsOnPage(page) {
  return await page.evaluate(() => {
    const ids = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
    const inPageLinks = Array.from(document.querySelectorAll('a[href^="#"]'))
      .map(el => el.getAttribute('href').substring(1))
      .filter(id => id.length > 0); // Ignore simple href="#"

    const idCounts = {};
    for (const id of ids) {
      idCounts[id] = (idCounts[id] || 0) + 1;
    }

    const errors = [];
    for (const linkTarget of inPageLinks) {
      if (!idCounts[linkTarget]) {
        errors.push(`Link target '${linkTarget}' does not exist on the page.`);
      } else if (idCounts[linkTarget] > 1) {
        errors.push(`Link target '${linkTarget}' has duplicate IDs (${idCounts[linkTarget]} found).`);
      }
    }

    for (const [id, count] of Object.entries(idCounts)) {
        if (count > 1) {
            // Even if no link points to it, duplicate IDs are invalid HTML,
            // but the prompt says: "Every table-of-contents and in-page link targets an existing id"
            // Let's only fail on the link targets per the epic description.
            // Actually, the epic says "Check that TOC links, heading anchors, footnotes, and skip links point at IDs that exist exactly once on the page."
            // So checking the link targets is sufficient.
        }
    }

    // Return unique errors
    return Array.from(new Set(errors));
  });
}

test.describe('anchor checker logic', () => {
  test('fails on missing or duplicate IDs in fixture', async ({ page }) => {
    // Deliberately broken fixture
    await page.setContent(`
      <a href="#missing">Missing</a>
      <a href="#duplicate">Duplicate</a>
      <a href="#ok">OK</a>
      <div id="duplicate">1</div>
      <div id="duplicate">2</div>
      <div id="ok">3</div>
    `);

    const errors = await checkAnchorsOnPage(page);
    expect(errors).toContain("Link target 'missing' does not exist on the page.");
    expect(errors).toContain("Link target 'duplicate' has duplicate IDs (2 found).");
    expect(errors.length).toBe(2); // Only these two errors should exist
  });
});

const builtPages = JSON.parse(process.env.BUILT_PAGES || '{}');

for (const [relativePath, url] of Object.entries(builtPages)) {
  test(`page '${relativePath}' has valid anchors in LTR/light`, async ({ page }) => {
    await page.goto(url);
    const errors = await checkAnchorsOnPage(page);
    if (errors.length > 0) {
      console.error(`Anchor errors on ${relativePath}:`, errors);
    }
    expect(errors).toEqual([]);
  });

  test(`page '${relativePath}' has valid anchors in RTL/dark`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto(url);
    await page.evaluate(() => {
      document.documentElement.setAttribute('dir', 'rtl');
    });

    const errors = await checkAnchorsOnPage(page);
    if (errors.length > 0) {
      console.error(`Anchor errors on ${relativePath} (RTL/Dark):`, errors);
    }
    expect(errors).toEqual([]);
  });
}
