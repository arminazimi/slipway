import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/i18n.kashida.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);

test("i18n.kashida reports kashida and repeated letters at their column", async () => {
  const site = new Site(fixture("i18n-kashida"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");
  assert.deepEqual(
    findings.map(({ file, line, column, fix }) => ({ file, line, column, fix })),
    [
      { file: "page.md", line: 5, column: 9, fix: "این یک کتاب است." },
      { file: "page.md", line: 6, column: 4, fix: "خیلی خوب است." },
    ],
  );
  assert.match(findings[0].message, /kashida/);
  assert.match(findings[1].message, /repeats/);
});

test("i18n.kashida ignores inline code and fenced code", async () => {
  const site = new Site(fixture("i18n-kashida"));
  const { findings } = await run(site);
  assert.equal(findings.some((finding) => finding.line === 8 || finding.line >= 10), false);
});

test("i18n.kashida is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const site = new Site(join(repo, "examples", name));
    const { status, findings } = await run(site);
    assert.equal(status, "pass", `${name} failed with findings: ${JSON.stringify(findings)}`);
    assert.deepEqual(findings, []);
  }
});
