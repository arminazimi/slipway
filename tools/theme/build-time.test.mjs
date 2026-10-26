import test from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { buildExample, bundleAvailable } from "./build.mjs";

export const budgetSeconds = 15;

test("1,000-post site builds within the time budget on the Pages gem", { skip: !bundleAvailable() }, () => {
  const work = mkdtempSync(join(tmpdir(), "slipway-budget-"));
  try {
    const siteDir = join(work, "1000-post");
    mkdirSync(siteDir);
    mkdirSync(join(siteDir, "_posts"));
    writeFileSync(join(siteDir, "_config.yml"), "theme: slipway-theme\ntitle: 1000 posts\n");
    for (let i = 0; i < 1000; i++) {
      const date = new Date(Date.now() - i * 86400000).toISOString().split("T")[0];
      const content = `---\nlayout: post\ntitle: Post ${i}\n---\nHello world!\n`;
      writeFileSync(join(siteDir, "_posts", `${date}-post-${i}.md`), content);
    }
    const start = performance.now();
    buildExample("gem", join(work, "out"), siteDir);
    const end = performance.now();
    const elapsed = (end - start) / 1000;
    assert.ok(elapsed <= budgetSeconds, `1,000-post build took ${elapsed.toFixed(1)}s (budget: ${budgetSeconds}s)`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
