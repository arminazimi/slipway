import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { run } from "../src/checks/schema-coverage.mjs";
import { Site } from "../src/site.mjs";

const fixture = (name) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));
const examplesPath = fileURLToPath(new URL("../../../examples", import.meta.url));

test("schema-coverage reports layouts with no schema", async () => {
  const site = new Site(fixture("schema-coverage"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, "index.md");
  assert.equal(findings[0].message, "uses layout 'recipe' but no schema covers it");
});

test("schema-coverage stays silent on examples", async () => {
  const examples = readdirSync(examplesPath);
  for (const example of examples) {
    const site = new Site(join(examplesPath, example));
    const { findings } = await run(site);

    assert.equal(findings.length, 0, `Example ${example} had findings: ${JSON.stringify(findings)}`);
  }
});
