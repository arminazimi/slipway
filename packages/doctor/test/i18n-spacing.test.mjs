import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run, level } from "../src/checks/i18n.spacing.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/i18n-spacing/${name}`);

test("i18n.spacing reports each problem with its line, column, and fix", async () => {
  const { status, findings } = await run(new Site(fixture("")));
  const bad = findings.filter((f) => f.file === "page.md");
  assert.equal(status, "fail");
  assert.deepEqual(
    bad.map(({ line, column, fix }) => ({ line, column, fix })),
    [
      { line: 5, column: 6, fix: "Hello, world." },
      { line: 6, column: 6, fix: "Fine, but not here." },
      { line: 7, column: 4, fix: "Two spaces here." },
    ],
  );
});

test("i18n.spacing stays a warning", () => assert.equal(level, "warning"));

test("i18n.spacing is silent on clean text, code, and French marks", async () => {
  for (const name of ["clean", "code", "french"]) {
    const { status, findings } = await run(new Site(fixture(name)));
    assert.equal(status, "pass", `${name}: ${JSON.stringify(findings)}`);
  }
});

test("i18n.spacing is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const { status, findings } = await run(new Site(join(repo, "examples", name)));
    assert.equal(status, "pass", `${name} failed with findings: ${JSON.stringify(findings)}`);
  }
});
