import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/ae.schemas.config.ts";
import { Site } from "../src/site.ts";

const docsSite = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));

/** A temporary engine site: `slipway.yml` and a schema index that matches `files`. */
function engineSite(t, files) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-schemas-config-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(join(dir, "slipway.yml"), "title: Beacon\n");
  writeFileSync(
    join(dir, "content-schemas.json"),
    JSON.stringify({ version: "0.1", schemas: [{ files, target: "file", schema: "schema/config.schema.json" }] }),
  );
  return dir;
}

test("ae.schemas.config passes when an entry matches the engine's slipway.yml", async (t) => {
  const { status, findings } = await run(new Site(engineSite(t, ["slipway.yml"])));
  assert.equal(status, "pass");
  assert.deepEqual(findings, []);
});

test("ae.schemas.config reports slipway.yml with its line when no entry matches", async (t) => {
  const { status, findings } = await run(new Site(engineSite(t, ["_config.yml"])));
  assert.equal(status, "fail");
  assert.deepEqual(
    findings.map(({ file, line, message }) => ({ file, line, message })),
    [
      {
        file: "slipway.yml",
        line: 1,
        message: 'is a configuration file the generator reads, but no `target: "file"` entry in content-schemas.json matches it',
      },
    ],
  );
});

test("ae.schemas.config still needs the index on fixtures/docs-site", async () => {
  const { status, findings } = await run(new Site(docsSite));
  assert.equal(status, "fail");
  assert.equal(findings[0].file, "content-schemas.json");
});
