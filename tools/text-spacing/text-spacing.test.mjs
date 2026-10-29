import { test, expect } from '@playwright/test';

// 1) Unit test for the checker itself: fails on a deliberately broken fixture.
test('text spacing checker fails on a deliberately broken fixture', async ({ page }) => {
  await page.setContent(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Broken Fixture</title>
      <style>
        .broken-clip {
          width: 100px;
          height: 20px; /* Forces clipping when WCAG spacing applied */
          overflow: hidden;
          background: #eee;
        }
      </style>
    </head>
    <body>
      <div class="broken-clip">This is a long text that will definitely be clipped when we add the WCAG 1.4.12 text spacing rules because the container has fixed height and overflow hidden.</div>
    </body>
    </html>
  `);

  // Apply WCAG 1.4.12 text spacing
  await page.addStyleTag({
    content: `
      * {
        line-height: 1.5 !important;
        letter-spacing: 0.12em !important;
        word-spacing: 0.16em !important;
      }
      p {
        margin-bottom: 2em !important;
      }
    `
  });

  // Check for clipping
  const clippingViolations = await page.evaluate(() => {
    const violations = [];
    const elements = document.querySelectorAll('*:not(script):not(style):not(meta):not(link):not(head):not(html):not(body)');

    for (const el of elements) {
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
      if (!el.innerText || el.innerText.trim() === '') continue;

      const isScrollable = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      const hasOverflowHidden = style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden' || style.overflow === 'clip' || style.overflowX === 'clip' || style.overflowY === 'clip' || style.textOverflow === 'ellipsis';

      if (isScrollable && hasOverflowHidden) {
        violations.push({
          tagName: el.tagName.toLowerCase(),
          className: el.className,
          text: el.innerText.substring(0, 50).replace(/\n/g, ' ') + (el.innerText.length > 50 ? '...' : '')
        });
      }
    }
    return violations;
  });

  expect(clippingViolations.length).toBeGreaterThan(0);
});

// 2) Run on the built pages if available
const builtPages = JSON.parse(process.env.BUILT_PAGES || '{}');
for (const [relativePath, url] of Object.entries(builtPages)) {
  test(`page '${relativePath}' has no text clipping with WCAG text spacing`, async ({ page }) => {
    await page.goto(url);

    // Apply WCAG 1.4.12 text spacing
    await page.addStyleTag({
      content: `
        * {
          line-height: 1.5 !important;
          letter-spacing: 0.12em !important;
          word-spacing: 0.16em !important;
        }
        p {
          margin-bottom: 2em !important;
        }
      `
    });

    const clippingViolations = await page.evaluate(() => {
      const violations = [];
      const elements = document.querySelectorAll('*:not(script):not(style):not(meta):not(link):not(head):not(html):not(body)');

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue;
        if (!el.innerText || el.innerText.trim() === '') continue;

        const isScrollable = el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
        const hasOverflowHidden = style.overflow === 'hidden' || style.overflowX === 'hidden' || style.overflowY === 'hidden' || style.overflow === 'clip' || style.overflowX === 'clip' || style.overflowY === 'clip' || style.textOverflow === 'ellipsis';

        if (isScrollable && hasOverflowHidden) {
          violations.push({
            tagName: el.tagName.toLowerCase(),
            className: el.className,
            text: el.innerText.substring(0, 50).replace(/\n/g, ' ') + (el.innerText.length > 50 ? '...' : '')
          });
        }
      }
      return violations;
    });

    if (clippingViolations.length > 0) {
      console.log(`Clipping violations on ${relativePath}:`, clippingViolations);
    }
    expect(clippingViolations.length).toBe(0); // Actually fail if violations exist
  });
}
