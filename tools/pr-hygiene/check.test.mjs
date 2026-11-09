import assert from "node:assert/strict";
import { test } from "node:test";
import { check, closedIssues, comment, MARKER } from "./check.mjs";

test("a body without Closes # is a problem", () => {
  const problems = check({ body: "Does things", files: ["README.md"] });
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Closes #/);
});

test("Closes, fixes and resolves all name an issue", () => {
  assert.deepEqual(closedIssues("Closes #12\nfixes #7 and Resolved #12"), [12, 7]);
  assert.deepEqual(closedIssues(null), []);
});

test("a theme change without changelog.d/<n>.md is a problem", () => {
  for (const file of ["packages/theme/layouts/base.ts", "packages/theme/chrome/a/index.ts", "packages/theme/styles/x.css", "schema/a.json", "skills/a/SKILL.md"]) {
    const problems = check({ body: "Closes #5", files: [file] });
    assert.equal(problems.length, 1, file);
    assert.match(problems[0], /changelog\.d\/5\.md/);
  }
});

test("the fragment for the closed issue satisfies the rule", () => {
  assert.deepEqual(check({ body: "Closes #5", files: ["packages/theme/layouts/base.ts", { filename: "changelog.d/5.md" }] }), []);
});

test("a fragment for another issue does not", () => {
  assert.equal(check({ body: "Closes #5", files: ["packages/theme/styles/a.css", "changelog.d/6.md"] }).length, 1);
});

test("the no-changelog label skips the fragment rule, not the Closes rule", () => {
  assert.deepEqual(check({ body: "Closes #5", files: ["assets/js/a.js"], labels: [{ name: "no-changelog" }] }), []);
  assert.equal(check({ body: "", files: ["assets/js/a.js"], labels: ["no-changelog"] }).length, 1);
});

test("files a site owner does not see need no fragment", () => {
  assert.deepEqual(check({ body: "Closes #5", files: ["tools/a.mjs", "docs/a.md", ".github/workflows/a.yml"] }), []);
});

test("the comment carries the marker and every problem", () => {
  const text = comment(["a", "b"]);
  assert.ok(text.startsWith(MARKER));
  assert.match(text, /- a\n- b$/);
});
