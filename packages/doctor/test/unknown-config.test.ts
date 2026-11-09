import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/unknown-config.ts";
import { Site } from "../src/site.ts";

const fixture = (name) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));

test("unknown-config warns on unknown keys and suggests valid keys", async () => {
  const site = new Site(fixture("unknown-config"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");
  assert.equal(findings.length, 2);

  const headerFinding = findings.find(f => f.key === "headr");
  assert.ok(headerFinding);
  assert.equal(headerFinding.message, "unknown config key `headr`, did you mean `header`?");
  assert.equal(headerFinding.file, "_config.yml");
  assert.equal(headerFinding.line, 2);

  const accentFinding = findings.find(f => f.key === "acent");
  assert.ok(accentFinding);
  assert.equal(accentFinding.message, "unknown config key `acent`, did you mean `accent`?");
  assert.equal(accentFinding.file, "_config.yml");
  assert.equal(accentFinding.line, 4);
});

import { readdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const docsSite = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));

test("unknown-config reads the engine's slipway.yml with lines and nested suggestions", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-unknown-config-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(
    join(dir, "slipway.yml"),
    [
      "title: Beacon",
      "languags: [en]",
      "repository:",
      "  url: https://github.com/example/beacon-docs",
      "  brnch: main",
    ].join("\n"),
  );

  const { status, findings } = await run(new Site(dir));
  assert.equal(status, "fail");
  assert.equal(findings.length, 2);

  const header = findings.find((finding) => finding.key === "languags");
  assert.equal(header.file, "slipway.yml");
  assert.equal(header.line, 2);
  assert.equal(header.message, "unknown config key `languags`, did you mean `languages`?");

  const branch = findings.find((finding) => finding.key === "repository.brnch");
  assert.equal(branch.file, "slipway.yml");
  assert.equal(branch.line, 5);
  assert.equal(branch.message, "unknown config key `repository.brnch`, did you mean `repository.branch`?");
});

test("unknown-config passes on fixtures/docs-site", async () => {
  const { status, findings } = await run(new Site(docsSite));
  assert.equal(status, "pass");
  assert.deepEqual(findings, []);
});

test("unknown-config does not fire on examples", async () => {
  const examplesPath = fileURLToPath(new URL("../../../packages/doctor/test/fixtures/examples", import.meta.url));
  const examples = readdirSync(examplesPath);

  for (const example of examples) {
    const site = new Site(join(examplesPath, example));
    const { status, findings } = await run(site);

    // We shouldn't get any findings for unknown configurations on valid examples
    assert.equal(findings.length, 0, `Example ${example} had findings: ${JSON.stringify(findings)}`);
  }
});
