import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Known violations that we will report in the PR but not fix immediately.
// Format: { exampleName: [ ruleId, ... ] }
const KNOWN_VIOLATIONS = {
  bare: [],
  blog: ['aria-prohibited-attr'],
  docs: ['aria-prohibited-attr'],
  minimal: ['aria-prohibited-attr'],
  persian: ['aria-prohibited-attr']
};

test.describe('accessibility tests', () => {
  const sitesEnv = process.env.SITE_URLS;
  if (!sitesEnv) {
    throw new Error('SITE_URLS environment variable is required');
  }
  const sites = JSON.parse(sitesEnv);

  for (const [name, url] of Object.entries(sites)) {
    test(`example ${name} has no axe violations`, async ({ page }, testInfo) => {
      await page.goto(url);

      if (testInfo.project.name === 'chromium-rtl') {
        await page.evaluate(() => {
          document.documentElement.setAttribute('dir', 'rtl');
        });
      }

      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

      const violations = accessibilityScanResults.violations;
      const violationIds = violations.map(v => v.id);

      const expectedViolations = KNOWN_VIOLATIONS[name] || [];

      const unexpectedViolations = violations.filter(v => !expectedViolations.includes(v.id));

      if (unexpectedViolations.length > 0) {
        console.error(`Unexpected violations in ${name}:`, JSON.stringify(unexpectedViolations, null, 2));
      }

      expect(unexpectedViolations).toEqual([]);
    });
  }
});
