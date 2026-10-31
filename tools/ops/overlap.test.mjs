import assert from "node:assert/strict";
import { test } from "node:test";
import { MARKER, changedFiles, overlapComment, plan } from "./overlap.mjs";

// Recorded API shapes: a pull request with the files and comments endpoints'
// answers, trimmed to what the script reads.
const pull = (number, { files = [], comments = [] } = {}) => ({
  number,
  files: files.map((filename) => ({ filename })),
  comments,
});

test("both sides of an overlap get a comment naming the file and the other pull request", () => {
  const result = plan([
    pull(12, { files: ["_layouts/base.html", "changelog.d/12.md"] }),
    pull(13, { files: ["_layouts/base.html", "_includes/head.html"] }),
  ]);

  assert.equal(result.write.length, 2);
  assert.deepEqual(result.write.map(({ number }) => number), [12, 13]);
  assert.match(result.write[0].body, /^<!-- slipway-ops-overlap -->$/m);
  assert.match(result.write[0].body, /^- `_layouts\/base\.html` — also in #13$/m);
  assert.doesNotMatch(result.write[0].body, /changelog\.d\//);
  assert.match(result.write[1].body, /^- `_layouts\/base\.html` — also in #12$/m);
  assert.equal(result.remove.length, 0);
});

test("a pull request that shares nothing gets no comment", () => {
  const result = plan([pull(14, { files: ["README.md"] }), pull(15, { files: ["CONTRIBUTING.md"] })]);
  assert.deepEqual(result.write, []);
  assert.deepEqual(result.remove, []);
  assert.deepEqual(result.skip, [
    { number: 14, reason: "no overlap" },
    { number: 15, reason: "no overlap" },
  ]);
});

test("changelog fragments alone are never an overlap", () => {
  const result = plan([
    pull(16, { files: ["changelog.d/16.md"] }),
    pull(17, { files: ["changelog.d/17.md"] }),
  ]);
  assert.deepEqual(result.write, []);
  assert.deepEqual(result.remove, []);
});

test("an existing comment is edited in place, not duplicated", () => {
  const first = plan([pull(18, { files: ["a.md"] }), pull(19, { files: ["a.md"] })]);
  const body = first.write[0].body;
  const result = plan([
    pull(18, { files: ["a.md", "b.md"], comments: [{ id: 501, body }] }),
    pull(19, { files: ["a.md"] }),
  ]);

  assert.equal(result.write[0].number, 18);
  assert.equal(result.write[0].commentId, 501);
  assert.match(result.write[0].body, /`a\.md` — also in #19/);
  assert.doesNotMatch(result.write[0].body, /b\.md/);
});

test("the comment is removed when the overlap is gone", () => {
  const comments = [{ id: 502, body: `${MARKER}\n\n- \`a.md\` — also in #21` }];
  const result = plan([pull(20, { files: ["a.md"], comments }), pull(21, { files: ["b.md"] })]);

  assert.deepEqual(result.write, []);
  assert.deepEqual(result.remove, [{ number: 20, commentId: 502 }]);
});

test("overlapComment lists every shared file in order", () => {
  const byFile = new Map([
    ["z.md", new Set([1, 2])],
    ["a.md", new Set([1, 3])],
    ["solo.md", new Set([1])],
  ]);
  const body = overlapComment({ number: 1 }, byFile);
  const lines = body.split("\n").filter((line) => line.startsWith("- "));
  assert.deepEqual(lines, ["- `a.md` — also in #3", "- `z.md` — also in #2"]);
});

test("changedFiles drops duplicates and changelog fragments", () => {
  assert.deepEqual(
    changedFiles({ files: [{ filename: "b.md" }, { filename: "a.md" }, { filename: "a.md" }, { filename: "changelog.d/9.md" }] }),
    ["a.md", "b.md"],
  );
});
