import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/root-links.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);

test("root-links fires on broken fixture", async () => {
  const site = new Site(fixture("root-links"));
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, "index.md");
  assert.equal(findings[0].line, 2); // [Rules](/rules/) is on line 2
});

test("root-links is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const siteDir = join(repo, "examples", name);
    const site = new Site(siteDir);
    const { status, findings } = await run(site);
    assert.equal(status, "pass");
    assert.deepEqual(findings, []);
  }
});
