import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/twin-fresh.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);

test("twin-fresh fires on broken fixture", async () => {
  const site = new Site(fixture("twin-fresh"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");

  const orphaned = findings.find(f => f.file === "orphaned.twin.html");
  assert.ok(orphaned);
  assert.equal(orphaned.line, 4);

  const missing = findings.find(f => f.file === "missing.md");
  assert.ok(missing);
  assert.equal(missing.line, 1);
});

test("twin-fresh is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const siteDir = join(repo, "examples", name);
    const site = new Site(siteDir, { build: siteDir });
    const { status, findings } = await run(site);
    assert.equal(status, "pass", `${name} failed with findings: ${JSON.stringify(findings)}`);
    assert.deepEqual(findings, []);
  }
});
