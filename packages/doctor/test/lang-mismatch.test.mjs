import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/lang-mismatch.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);

test("lang-mismatch warns when page text script differs from its lang", async () => {
  const site = new Site(fixture("lang-mismatch"));
  const { status, findings } = await run(site);
  assert.equal(status, "fail");
  assert.equal(findings.length, 2);

  const explicitFinding = findings.find(f => f.file === "pages/fa-explicit.md");
  assert.ok(explicitFinding);
  assert.equal(explicitFinding.line, 3);
  assert.match(explicitFinding.message, /dominant script is Arabic/);

  const implicitFinding = findings.find(f => f.file === "pages/fa-mismatch.md");
  assert.ok(implicitFinding);
  assert.equal(implicitFinding.line, undefined);
  assert.match(implicitFinding.message, /dominant script is Arabic/);
});

test("lang-mismatch is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const siteDir = join(repo, "examples", name);
    const site = new Site(siteDir);
    const { status, findings } = await run(site);
    assert.equal(status, "pass");
    assert.deepEqual(findings, []);
  }
});
