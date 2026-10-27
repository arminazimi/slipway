import { test, expect } from '@playwright/test';

const builtPages = JSON.parse(process.env.BUILT_PAGES || '{}');
const FIXTURE_URL = process.env.FIXTURE_URL;

if (FIXTURE_URL) {
  test('fails on a deliberately broken fixture', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(FIXTURE_URL);

    const elementsWithMotion = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const motionElements = [];

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const transitionDuration = parseFloat(style.transitionDuration) || 0;
        const animationDuration = parseFloat(style.animationDuration) || 0;

        if (transitionDuration > 0 || animationDuration > 0) {
          motionElements.push({
            tagName: el.tagName,
            className: el.className,
            transitionDuration,
            animationDuration
          });
        }
      }
      return motionElements;
    });

    // The fixture should have at least one element with motion
    expect(elementsWithMotion.length).toBeGreaterThan(0);
  });
}

for (const [relativePath, url] of Object.entries(builtPages)) {
  test(`page '${relativePath}' disables motion when requested`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(url);

    // Evaluate that transition and animation duration is 0 for all elements
    const elementsWithMotion = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('*'));
      const motionElements = [];

      for (const el of elements) {
        const style = window.getComputedStyle(el);
        const transitionDuration = parseFloat(style.transitionDuration) || 0;
        const animationDuration = parseFloat(style.animationDuration) || 0;

        if (transitionDuration > 0 || animationDuration > 0) {
          motionElements.push({
            tagName: el.tagName,
            className: el.className,
            transitionDuration,
            animationDuration
          });
        }
      }
      return motionElements;
    });

    expect(elementsWithMotion).toEqual([]);
  });
}
