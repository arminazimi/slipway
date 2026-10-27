import { test, expect } from '@playwright/test';
import { contrastRatio } from '../theme/contrast.mjs';

function rgbToHex(rgbStr) {
  const match = rgbStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return '#000000';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

const rougeClasses = [
  'c', 'c1', 'cm', 'cs',
  'k', 'kd', 'kn', 'kr', 'kt', 'm', 'mi', 'mf', 'nb', 'nf',
  's', 's1', 's2', 'sb', 'sa'
];

test.describe('code contrast', () => {
  const siteUrls = JSON.parse(process.env.SITE_URLS || "{}");
  const examples = Object.keys(siteUrls);

  test('deliberately broken fixture fails contrast', async ({ page }) => {
    // If we're not running in full mode and no SITE_URLS were passed, skip.
    if (!examples.length) {
      test.skip();
      return;
    }
    await page.goto(siteUrls['bare']);

    const pairs = await page.evaluate((classes) => {
      // Must mock the layout so that Rouge CSS matches correctly.
      // E.g., assets/css/slipway.css styles .highlight classes
      const content = document.createElement('div');
      content.id = 'main'; // Needed for some context styles?

      const wrapper = document.createElement('div');
      wrapper.className = 'highlighter-rouge';

      const div = document.createElement('div');
      div.className = 'highlight';
      wrapper.appendChild(div);

      const pre = document.createElement('pre');
      pre.className = 'highlight';
      pre.style.setProperty('background-color', '#ffffff', 'important'); // Force White bg
      div.appendChild(pre);

      const code = document.createElement('code');
      pre.appendChild(code);

      const spans = [];
      for (const cls of classes) {
        const span = document.createElement('span');
        span.className = cls;
        span.style.setProperty('color', '#eeeeee', 'important'); // Force Light gray fg -> bad contrast on white
        span.textContent = 'test';
        code.appendChild(span);
        spans.push(span);
      }

      content.appendChild(wrapper);
      document.body.appendChild(content);

      const bgRgb = window.getComputedStyle(pre).backgroundColor;
      const results = [];
      for (let i = 0; i < classes.length; i++) {
        const fgRgb = window.getComputedStyle(spans[i]).color;
        results.push({ cls: classes[i], fg: fgRgb, bg: bgRgb });
      }

      document.body.removeChild(content);
      return results;
    }, rougeClasses);

    let failed = false;
    for (const { cls, fg, bg } of pairs) {
      const fgHex = rgbToHex(fg);
      const bgHex = rgbToHex(bg);
      const ratio = contrastRatio(fgHex, bgHex);
      if (ratio < 4.5) failed = true;
    }
    expect(failed).toBeTruthy();
  });

  for (const name of examples) {
    test(`example ${name} has accessible code syntax contrast`, async ({ page }, testInfo) => {
      if (testInfo.project.name.includes('rtl')) {
        await page.addInitScript(() => {
          document.documentElement.setAttribute('dir', 'rtl');
        });
      }

      const scheme = testInfo.project.name.includes('dark') ? 'dark' : 'light';
      await page.addInitScript((s) => {
        document.documentElement.setAttribute('data-theme', s);
      }, scheme);

      await page.goto(siteUrls[name]);

      // Explicitly set data-theme again just to be sure it takes effect in case page JS overwrote it
      await page.evaluate((s) => {
        document.documentElement.setAttribute('data-theme', s);
      }, scheme);

      const pairs = await page.evaluate((classes) => {
        // Find existing .highlight blocks or create one if none exist on this page
        let pre = document.querySelector('.highlight pre.highlight');
        let created = false;
        let content;

        if (!pre) {
          created = true;
          content = document.createElement('div');
          content.id = 'main';

          const wrapper = document.createElement('div');
          wrapper.className = 'highlighter-rouge';

          const div = document.createElement('div');
          div.className = 'highlight';
          wrapper.appendChild(div);

          pre = document.createElement('pre');
          pre.className = 'highlight';
          div.appendChild(pre);

          content.appendChild(wrapper);
          document.body.appendChild(content);
        }

        // ensure there is a code block inside
        let code = pre.querySelector('code');
        if (!code) {
          code = document.createElement('code');
          pre.appendChild(code);
        }

        const originalSpans = Array.from(code.querySelectorAll('span'));

        const spans = [];
        for (const cls of classes) {
          const span = document.createElement('span');
          span.className = cls;
          span.textContent = 'test';
          code.appendChild(span);
          spans.push(span);
        }

        // Compute colors
        // Wait a tiny bit just in case styles are loading, though they should be sync here
        const bgRgb = window.getComputedStyle(pre).backgroundColor;

        const results = [];
        for (let i = 0; i < classes.length; i++) {
          const fgRgb = window.getComputedStyle(spans[i]).color;
          results.push({ cls: classes[i], fg: fgRgb, bg: bgRgb });
        }

        // Clean up
        for (const span of spans) {
          code.removeChild(span);
        }
        if (created) {
          document.body.removeChild(content);
        }

        return results;
      }, rougeClasses);

      for (const { cls, fg, bg } of pairs) {
        const fgHex = rgbToHex(fg);
        const bgHex = rgbToHex(bg);
        const ratio = contrastRatio(fgHex, bgHex);
        expect(ratio, `Token .${cls} (${fgHex} on ${bgHex}) contrast ${ratio.toFixed(2)} must be >= 4.5 in ${testInfo.project.name}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
