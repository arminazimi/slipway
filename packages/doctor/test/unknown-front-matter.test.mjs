import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { run } from "../src/checks/unknown-front-matter.mjs";
import { Site } from "../src/site.mjs";

const fixture = (name) => fileURLToPath(new URL(`fixtures/${name}`, import.meta.url));
const examplesPath = fileURLToPath(new URL("../../../examples", import.meta.url));

test("unknown-front-matter warns on unknown fields and suggests valid keys", async () => {
  const site = new Site(fixture("unknown-front-matter"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");
  assert.equal(findings.length, 2);

  const tittleFinding = findings.find(f => f.key === "tittle");
  assert.ok(tittleFinding);
  assert.equal(tittleFinding.message, "unknown front matter field `tittle`, did you mean `title`?");
  assert.equal(tittleFinding.file, "page.md");
  assert.equal(tittleFinding.line, 3);

  const descriptonFinding = findings.find(f => f.key === "descripton");
  assert.ok(descriptonFinding);
  assert.equal(descriptonFinding.message, "unknown front matter field `descripton`, did you mean `description`?");
  assert.equal(descriptonFinding.file, "page.md");
  assert.equal(descriptonFinding.line, 4);
});

test("unknown-front-matter stays silent on examples", async () => {
  const examples = readdirSync(examplesPath);
  for (const example of examples) {
    const site = new Site(join(examplesPath, example));
    const { findings } = await run(site);

    assert.equal(findings.length, 0, `Example ${example} had findings: ${JSON.stringify(findings)}`);
  }
});
