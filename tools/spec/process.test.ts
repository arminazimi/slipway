import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("../../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root), "utf8");

test("the spec index links the process, the RFC template, and the changelog", () => {
  const index = read("spec/README.md");
  for (const link of ["(PROCESS.md)", "(rfcs/0000-template.md)", "(CHANGELOG.md)"]) {
    assert.ok(index.includes(link), `spec/README.md links ${link}`);
  }
});

test("the RFC template has every section the process asks for", () => {
  const template = read("spec/rfcs/0000-template.md");
  const headings = [...template.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  assert.deepEqual(headings, ["Summary", "Motivation", "Change", "Compatibility", "Alternatives"]);
  assert.match(template, /\*\*Breaking:\*\*/);
});

test("the process names the review window and fits on one screen", () => {
  const process = read("spec/PROCESS.md");
  assert.match(process, /14 days/);
  assert.ok(process.includes("CHANGELOG.md"), "accepted RFCs add a changelog entry");
  const lines = process.split("\n").length;
  assert.ok(lines <= 40, `PROCESS.md has ${lines} lines`);
  assert.ok(process.split(/\s+/).length <= 400, "PROCESS.md stays under 400 words");
});

test("the spec changelog has an entry for each published version", () => {
  const changelog = read("spec/CHANGELOG.md");
  assert.match(changelog, /^### 0\.1 /m);
  assert.match(changelog, /^### 0 /m);
});

test("every relative link in the process files resolves", () => {
  const files = ["spec/PROCESS.md", "spec/CHANGELOG.md", "spec/rfcs/0000-template.md"];
  for (const file of files) {
    for (const [, target] of read(file).matchAll(/\]\(([^)#]+)(#[^)]*)?\)/g)) {
      if (/^[a-z]+:/.test(target)) continue;
      assert.ok(existsSync(new URL(target, new URL(file, root))), `${file} links ${target}`);
    }
  }
});

test("the pull request template has a section for spec changes", () => {
  const template = read(".github/pull_request_template.md");
  assert.match(template, /^## Spec changes$/m);
  for (const path of ["spec/PROCESS.md", "spec/rfcs/0000-template.md", "spec/CHANGELOG.md"]) {
    assert.ok(template.includes(`\`${path}\``), `names ${path}`);
  }
});
