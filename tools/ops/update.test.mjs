import assert from "node:assert/strict";
import { test } from "node:test";
import { MARKER, conflictComment, isAgentBranch, plan } from "./update.mjs";

// Recorded API shapes: the fields the list and detail endpoints return, the
// comparison that says how far behind the branch is, and the files a conflicting
// pull request changes. Trimmed to what the script reads.
const pull = (
  number,
  { ref = `codex/${number}-task`, draft = false, mergeable = true, behindBy = 0, files = [], comments = [], headRepo = "arminazimi/slipway" } = {},
) => ({
  number,
  draft,
  mergeable,
  head: { ref, sha: `0123456789abcdef${number}`, repo: { full_name: headRepo } },
  base: { ref: "main" },
  compare: { status: behindBy > 0 ? "diverged" : "ahead", behind_by: behindBy },
  files: files.map((filename) => ({ filename })),
  comments,
});

test("an agent pull request that is behind is updated with a merge commit", () => {
  const result = plan([pull(12, { behindBy: 3 })]);
  assert.deepEqual(result.update, [{ number: 12, headSha: "0123456789abcdef12" }]);
  assert.deepEqual(result.comment, []);
  assert.deepEqual(result.skip, []);
});

test("a draft pull request is left alone even when it is behind", () => {
  const result = plan([pull(13, { draft: true, behindBy: 2 })]);
  assert.deepEqual(result.update, []);
  assert.deepEqual(result.comment, []);
  assert.deepEqual(result.skip, [{ number: 13, reason: "draft" }]);
});

test("a conflicting pull request is never updated and gets a comment naming its files", () => {
  const result = plan([
    pull(14, { mergeable: false, behindBy: 4, files: ["_layouts/base.html", "docs/modes.md"] }),
  ]);
  assert.deepEqual(result.update, []);
  assert.equal(result.comment.length, 1);
  assert.equal(result.comment[0].number, 14);
  assert.deepEqual(result.comment[0].files, ["_layouts/base.html", "docs/modes.md"]);
  assert.match(result.comment[0].body, /^- `_layouts\/base\.html`$/m);
  assert.match(result.comment[0].body, /^- `docs\/modes\.md`$/m);
  assert.match(result.comment[0].body, /conflicts/);
});

test("a conflict is commented once, and the comment carries the marker", () => {
  const first = plan([pull(15, { mergeable: false, files: ["index.md"] })]);
  assert.match(first.comment[0].body, new RegExp(MARKER));

  const second = plan([
    pull(15, { mergeable: false, files: ["index.md"], comments: [{ body: first.comment[0].body }] }),
  ]);
  assert.deepEqual(second.comment, []);
  assert.deepEqual(second.update, []);
  assert.deepEqual(second.skip, [{ number: 15, reason: "conflicted, already commented" }]);
});

test("a conflict comment without file names still tells the reader how to look", () => {
  const result = plan([pull(16, { mergeable: false })]);
  assert.match(result.comment[0].body, /git fetch origin main && git merge origin\/main/);
});

test("an up-to-date pull request is left alone", () => {
  const result = plan([pull(17)]);
  assert.deepEqual(result.update, []);
  assert.deepEqual(result.comment, []);
  assert.deepEqual(result.skip, [{ number: 17, reason: "up to date" }]);
});

test("only agent/* and codex/* branches are touched", () => {
  assert.ok(isAgentBranch("codex/691-ops-update"));
  assert.ok(isAgentBranch("agent/42-fix"));
  assert.ok(!isAgentBranch("dependabot/npm_and_yarn/yaml-2.9.1"));
  assert.ok(!isAgentBranch("main"));

  const result = plan([
    pull(18, { ref: "dependabot/npm_and_yarn/yaml-2.9.1", behindBy: 1 }),
    pull(19, { ref: "agent/691-ops-update", behindBy: 1 }),
  ]);
  assert.deepEqual(
    result.update.map((entry) => entry.number),
    [19],
  );
  assert.deepEqual(result.skip, [{ number: 18, reason: "not an agent branch" }]);
});

test("a pull request from a fork is skipped, because the token cannot write to it", () => {
  const result = plan([pull(20, { behindBy: 1, headRepo: "someone/slipway" })], {
    repo: "arminazimi/slipway",
  });
  assert.deepEqual(result.update, []);
  assert.deepEqual(result.skip, [{ number: 20, reason: "from a fork" }]);
});

test("a pull request whose mergeability GitHub has not computed yet is skipped", () => {
  const result = plan([{ ...pull(21, { behindBy: 1 }), mergeable: null }]);
  assert.deepEqual(result.update, []);
  assert.deepEqual(result.skip, [{ number: 21, reason: "mergeability unknown" }]);
});

test("a pull request with no comparison is skipped rather than assumed behind", () => {
  const result = plan([{ ...pull(22), compare: undefined }]);
  assert.deepEqual(result.update, []);
  assert.deepEqual(result.skip, [{ number: 22, reason: "no comparison" }]);
});

test("the conflict comment names the base branch it could not merge", () => {
  const body = conflictComment({ base: { ref: "release" }, files: [{ filename: "a.md" }] });
  assert.match(body, /`release` moved/);
  assert.match(body, /`a\.md`/);
});
