import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { findSeaworthy, runSeaworthy, validateSchemas } from "./check.mjs";

const temp = () => mkdtempSync(join(tmpdir(), "slipway-check-test-"));

test("validateSchemas accepts schemas and reports bad JSON and a missing $schema", () => {
  const dir = temp();
  mkdirSync(join(dir, "nested"));
  writeFileSync(join(dir, "good.json"), JSON.stringify({ $schema: "https://json-schema.org/draft/2020-12/schema" }));
  writeFileSync(join(dir, "nested/no-dialect.json"), "{}");
  writeFileSync(join(dir, "broken.json"), "{");
  const problems = validateSchemas(dir);
  assert.equal(problems.length, 2);
  assert.ok(problems.some((p) => p.startsWith("broken.json:")));
  assert.ok(problems.includes('nested/no-dialect.json: missing "$schema"'));
});

test("validateSchemas passes when the folder does not exist yet", () => {
  assert.deepEqual(validateSchemas(join(temp(), "schema")), []);
});

test("findSeaworthy prefers SEAWORTHY_CLI, then the pinned checkout, then null", () => {
  const base = temp();
  assert.equal(findSeaworthy({}, base), null);
  const pinned = join(base, ".seaworthy/seaworthy/packages/verify/dist/src");
  mkdirSync(pinned, { recursive: true });
  writeFileSync(join(pinned, "cli.js"), "");
  assert.equal(findSeaworthy({}, base), join(pinned, "cli.js"));
  const own = join(base, "own.js");
  writeFileSync(own, "");
  assert.equal(findSeaworthy({ SEAWORTHY_CLI: own }, base), own);
  assert.equal(findSeaworthy({ SEAWORTHY_CLI: join(base, "missing.js") }, base), join(pinned, "cli.js"));
});

test("runSeaworthy fails the check on the CLI's exit code and passes warnings to it", () => {
  const dir = temp();
  const cli = join(dir, "cli.js");
  writeFileSync(cli, "console.log(process.argv.slice(2).join(' ')); process.exit(process.env.FAKE_FAIL ? 1 : 0)");
  const pass = runSeaworthy(cli, "/site");
  assert.equal(pass.ok, true);
  assert.match(pass.output, /verify \/site --fail-on warning/);
  process.env.FAKE_FAIL = "1";
  try {
    assert.equal(runSeaworthy(cli, "/site").ok, false);
  } finally {
    delete process.env.FAKE_FAIL;
  }
});
