import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildExample, bundleAvailable } from "./build.mjs";

test("giscus comments script is included on posts when configured", { skip: !bundleAvailable() ? "Jekyll not available" : false }, () => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-comments-"));
  const outDir = join(dir, "out");
  const configPath = join(dir, "_config.yml");
  writeFileSync(configPath, `
title: Test
slipway:
  comments:
    giscus:
      repo: arminazimi/slipway
      repo_id: R_kgDOMuTfQQ
      category: Announcements
      category_id: DIC_kwDOMuTfQc4CiRyL
      mapping: pathname
`);

  mkdirSync(join(dir, "_posts"));
  writeFileSync(join(dir, "_posts", "2024-01-01-test.md"), "---\nlayout: post\ntitle: Test Post\n---\nHello");
  writeFileSync(join(dir, "index.md"), "---\nlayout: home\n---\nHome");

  buildExample("template", outDir, dir, { configs: [configPath] });

  const html = readFileSync(join(outDir, "2024/01/01/test.html"), "utf8");
  assert.ok(html.includes('class="giscus"'));
  assert.ok(html.includes('https://giscus.app/client.js'));
  assert.ok(html.includes('data-repo="arminazimi/slipway"'));
  assert.ok(html.includes('data-repo-id="R_kgDOMuTfQQ"'));
  assert.ok(html.includes('data-category="Announcements"'));
  assert.ok(html.includes('data-category-id="DIC_kwDOMuTfQc4CiRyL"'));

  const homeHtml = readFileSync(join(outDir, "index.html"), "utf8");
  assert.ok(!homeHtml.includes('class="giscus"'), "comments should not be on home page");

  rmSync(dir, { recursive: true });
});
