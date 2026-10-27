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
    await page.goto(siteUrls['bare']);

    const pairs = await page.evaluate((classes) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'highlighter-rouge';

      const div = document.createElement('div');
      div.className = 'highlight';
      wrapper.appendChild(div);

      const pre = document.createElement('pre');
      pre.className = 'highlight';
      pre.style.backgroundColor = '#ffffff'; // White bg
      div.appendChild(pre);

      const code = document.createElement('code');
      pre.appendChild(code);

      const spans = [];
      for (const cls of classes) {
        const span = document.createElement('span');
        span.className = cls;
        span.style.color = '#eeeeee'; // Light gray fg -> bad contrast on white
        span.textContent = 'test';
        code.appendChild(span);
        spans.push(span);
      }

      document.body.appendChild(wrapper);

      const bgRgb = window.getComputedStyle(pre).backgroundColor;
      const results = [];
      for (let i = 0; i < classes.length; i++) {
        const fgRgb = window.getComputedStyle(spans[i]).color;
        results.push({ cls: classes[i], fg: fgRgb, bg: bgRgb });
      }

      document.body.removeChild(wrapper);
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
    test(`example ${name} has accessible code syntax contrast`, async ({ page, project }) => {
      if (project.name.includes('rtl')) {
        await page.addInitScript(() => {
          document.documentElement.setAttribute('dir', 'rtl');
        });
      }

      await page.goto(siteUrls[name]);

      const pairs = await page.evaluate((classes) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'highlighter-rouge';

        const div = document.createElement('div');
        div.className = 'highlight';
        wrapper.appendChild(div);

        const pre = document.createElement('pre');
        pre.className = 'highlight';
        div.appendChild(pre);

        const code = document.createElement('code');
        pre.appendChild(code);

        const spans = [];
        for (const cls of classes) {
          const span = document.createElement('span');
          span.className = cls;
          span.textContent = 'test';
          code.appendChild(span);
          spans.push(span);
        }

        document.body.appendChild(wrapper);

        const bgRgb = window.getComputedStyle(pre).backgroundColor;

        const results = [];
        for (let i = 0; i < classes.length; i++) {
          const fgRgb = window.getComputedStyle(spans[i]).color;
          results.push({ cls: classes[i], fg: fgRgb, bg: bgRgb });
        }

        document.body.removeChild(wrapper);
        return results;
      }, rougeClasses);

      for (const { cls, fg, bg } of pairs) {
        const fgHex = rgbToHex(fg);
        const bgHex = rgbToHex(bg);
        const ratio = contrastRatio(fgHex, bgHex);
        expect(ratio, `Token .${cls} (${fgHex} on ${bgHex}) contrast ${ratio.toFixed(2)} must be >= 4.5 in ${project.name}`).toBeGreaterThanOrEqual(4.5);
      }
    });
  }
});
