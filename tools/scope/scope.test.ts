import test from "node:test";
import assert from "node:assert/strict";
import { briefPaths, check, toRegExp } from "./scope.ts";

const body = [
  "## Goal", "Do `not/this.js`.", "## Files", "Only these files.", "**Create**",
  "- `tools/x/run.mjs`", "- `docs/`", "- `assets/css/*.css`", "- `src/**/*.ts`", "## Done when", "- `after/section.md`",
].join("\n");

test("briefPaths reads only the Files section", () => {
  assert.deepEqual(briefPaths(body), ["tools/x/run.mjs", "docs/", "assets/css/*.css", "src/**/*.ts"]);
  assert.equal(briefPaths("## Goal\nnothing"), null);
});

test("exact paths, folders and globs", () => {
  const brief = briefPaths(body);
  const run = (files) => check({ briefs: [brief], files, issues: [1] }).outside;
  assert.deepEqual(run(["tools/x/run.mjs", "docs/a/b.md", "assets/css/a.css", "src/a/b/c.ts", "src/c.ts"]), []);
  assert.deepEqual(run(["tools/x/other.mjs", "assets/css/sub/a.css", "assets/js/a.js", "README.md"]),
    ["tools/x/other.mjs", "assets/css/sub/a.css", "assets/js/a.js", "README.md"]);
});

test("the changelog fragment of the issue is always allowed", () => {
  const result = check({ briefs: [["a.md"]], files: ["a.md", "changelog.d/7.md", "changelog.d/8.md"], issues: [7] });
  assert.deepEqual(result.outside, ["changelog.d/8.md"]);
});

test("an issue with no Files section passes with a notice", () => {
  const result = check({ briefs: [null], files: ["anything.md"], issues: [3] });
  assert.deepEqual(result.outside, []);
  assert.match(result.notice, /no `## Files` section/);
});

test("the scope: wide label skips the check", () => {
  const result = check({ briefs: [["a.md"]], files: ["b.md"], issues: [3], labels: ["scope: wide"] });
  assert.deepEqual(result.outside, []);
});

test("toRegExp escapes dots", () => {
  assert.equal(toRegExp("a.md").test("aXmd"), false);
});
