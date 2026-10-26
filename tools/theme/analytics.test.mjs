import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildExample, bundleAvailable } from "./build.mjs";

test("analytics scripts are included when configured", { skip: !bundleAvailable() ? "Jekyll not available" : false }, () => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-analytics-"));
  const outDir = join(dir, "out");
  const configPath = join(dir, "_config.yml");
  writeFileSync(configPath, "title: Test\nslipway:\n  analytics:\n    plausible: example.com\n    goatcounter: https://example.goatcounter.com/count\n    umami:\n      website_id: 123\n      url: https://analytics.umami.is/script.js");

  buildExample("template", outDir, "bare", { configs: [configPath] });

  const html = readFileSync(join(outDir, "index.html"), "utf8");
  assert.ok(html.includes('data-domain="example.com" src="https://plausible.io/js/script.js"'));
  assert.ok(html.includes('data-goatcounter="https://example.goatcounter.com/count" async src="//gc.zgo.at/count.js"'));
  assert.ok(html.includes('data-website-id="123"'));
  assert.ok(html.includes('src="https://analytics.umami.is/script.js"'));

  rmSync(dir, { recursive: true });
});
