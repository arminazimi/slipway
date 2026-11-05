import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/i18n.zwnj.mjs";
import { Site } from "../src/site.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const repo = here("../../../");
const fixture = (name) => here(`fixtures/${name}`);

test("i18n.zwnj reports missing joiners on prefixes, suffixes, and plurals", async () => {
  const site = new Site(fixture("i18n-zwnj"));
  const { status, findings } = await run(site);

  assert.equal(status, "fail");
  assert.deepEqual(
    findings.map(({ file, line, column, fix }) => ({ file, line, column, fix })),
    [
      { file: "page.md", line: 5, column: 1, fix: "می‌خواهم به خانه بروم." },
      { file: "page.md", line: 6, column: 1, fix: "نمی‌خواهم دیر برسم." },
      { file: "page.md", line: 7, column: 6, fix: "کتاب‌ها روی میز است." },
    ],
  );
  assert.match(findings[0].message, /as its own word/);
  assert.match(findings[2].message, /as its own word/);
});

test("i18n.zwnj ignores inline code and fenced code", async () => {
  const site = new Site(fixture("i18n-zwnj"));
  const { findings } = await run(site);
  assert.equal(findings.some((finding) => finding.line >= 11), false);
});

test("i18n.zwnj is silent on examples", async () => {
  for (const name of ["bare", "minimal", "docs", "blog", "persian"]) {
    const site = new Site(join(repo, "examples", name));
    const { status, findings } = await run(site);
    assert.equal(status, "pass", `${name} failed with findings: ${JSON.stringify(findings)}`);
    assert.deepEqual(findings, []);
  }
});
