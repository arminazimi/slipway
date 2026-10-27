import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/unknown-config.mjs";
import { Site } from "../src/site.mjs";

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

import { readdirSync } from "node:fs";
import { join } from "node:path";

test("unknown-config does not fire on examples", async () => {
  const examplesPath = fileURLToPath(new URL("../../../examples", import.meta.url));
  const examples = readdirSync(examplesPath);

  for (const example of examples) {
    const site = new Site(join(examplesPath, example));
    const { status, findings } = await run(site);

    // We shouldn't get any findings for unknown configurations on valid examples
    assert.equal(findings.length, 0, `Example ${example} had findings: ${JSON.stringify(findings)}`);
  }
});
