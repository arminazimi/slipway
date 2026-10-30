import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  computeProgress,
  epicTasks,
  progressBlock,
  progressComment,
  syncProgress,
  taskRefs,
  withProgress,
} from "./progress.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// Recorded from the repository on 2026-10-30: epic #666 lists tasks #805–#815 in its body,
// and #805, #849, #842, and #840 name their epic in their header, while #668 is not in the input.
const recorded = JSON.parse(readFileSync(join(here, "fixtures/issues.json"), "utf8"));

const issue = (number, { state = "open", labels = ["roadmap"], body = "", pull = false } = {}) => ({
  number,
  state,
  labels: labels.map((name) => ({ name })),
  body,
  ...(pull ? { pull_request: { url: `https://api.github.com/repos/x/y/pulls/${number}` } } : {}),
});

const epicBody = (tasks, { markers = null } = {}) => {
  const head = markers ? `${markers}\n\n` : "";
  return `${head}<!-- slipway-roadmap-key: E-test -->\n> **Epic** · **Phase:** v1\n\n## Tasks\n${tasks
    .map((n) => `- [ ] #${n}`)
    .join("\n")}\n\n---\n`;
};

const taskBody = (epic) => `<!-- slipway-roadmap-key: test-${epic} -->\n> **Epic:** #${epic} · **Phase:** v1\n\n## Goal\nDo it.\n`;

const epic = (number, tasks, body = epicBody(tasks)) =>
  issue(number, { labels: ["roadmap", "type: epic"], body });
const task = (number, epicNumber, state = "open") =>
  issue(number, { state, body: taskBody(epicNumber) });

/** An in-memory GitHub, so a test never calls it. */
function fakeApi() {
  let nextId = 100;
  const comments = new Map();
  const issues = new Map();
  const calls = [];
  return {
    state: { comments, issues, calls },
    comments: (n) => comments.get(n) ?? [],
    createComment(n, body) {
      const comment = { id: nextId++, body };
      comments.set(n, [...(comments.get(n) ?? []), comment]);
      calls.push(["create", n]);
    },
    updateComment(id, body) {
      for (const list of comments.values()) {
        const comment = list.find((c) => c.id === id);
        if (comment) {
          comment.body = body;
          calls.push(["update", id]);
          return;
        }
      }
      throw new Error(`no comment ${id}`);
    },
    updateIssue(n, body) {
      issues.set(n, body);
      calls.push(["body", n]);
    },
  };
}

test("the progress line is correct on the fixture", () => {
  const progress = computeProgress(recorded);
  assert.deepEqual(
    progress.map((p) => [p.epic.number, p.done, p.total]),
    [[666, 0, 11]],
    "epic #666 lists eleven tasks in its body and none is closed",
  );
  assert.equal(progress[0].line, "0 of 11 done");
});

test("a closed task counts as done", () => {
  const closed = recorded.map((i) => (i.number === 805 ? { ...i, state: "closed" } : i));
  assert.equal(computeProgress(closed)[0].line, "1 of 11 done");
});

test("a task counts even when the epic body was last synced before it existed", () => {
  const issues = [epic(10, [11, 12]), task(11, 10), task(12, 10)];
  assert.deepEqual(epicTasks(issues).get(10), [11, 12]);
  assert.equal(computeProgress(issues)[0].total, 2);

  const stale = [epic(10, [11]), task(11, 10), task(12, 10)];
  assert.equal(computeProgress(stale)[0].total, 2, "the task header adds #12");
});

test("tasks without an epic issue are linked but produce no line", () => {
  // #668 is not in the fixture, so its three tasks are grouped but never rendered.
  assert.deepEqual(epicTasks(recorded).get(668), [840, 842, 849]);
  assert.ok(!computeProgress(recorded).some((p) => p.epic.number === 668));
});

test("only issues under ## Tasks count, and a pull request is never a task", () => {
  const body = "## Tasks\n- [ ] #11\n- [x] #12\n- [ ] not a link\n\n## Exit criteria\n- [ ] #13\n";
  assert.deepEqual(taskRefs(body), [11, 12]);
  assert.equal(computeProgress([epic(10, [11, 12]), task(11, 10), issue(12, { pull: true })])[0].total, 2);
});

test("an epic with no tasks gets no line", () => {
  assert.deepEqual(computeProgress([epic(10, [])]), []);
});

test("the block is one line between markers", () => {
  assert.equal(progressBlock("7 of 12 done"), "<!-- progress -->\n**7 of 12 done**\n<!-- /progress -->");
});

test("the block is inserted at the top and replaced in place", () => {
  const block = progressBlock("7 of 12 done");
  const fresh = withProgress("<!-- slipway-roadmap-key: E-x -->\n> **Epic** · **Phase:** v1\n", block);
  assert.equal(fresh, `<!-- slipway-roadmap-key: E-x -->\n${block}\n\n> **Epic** · **Phase:** v1\n`);

  const old = `Some text\n\n<!-- progress -->\n**0 of 12 done**\n<!-- /progress -->\n`;
  assert.equal(withProgress(old, block), `Some text\n\n${block}\n`);
});

test("the progress comment is the one carrying the markers", () => {
  const comments = [{ id: 1, body: "Nice work" }, { id: 2, body: progressBlock("1 of 2 done") }];
  assert.equal(progressComment(comments)?.id, 2);
  assert.equal(progressComment([{ id: 1, body: "Nice work" }]), undefined);
});

test("a first run creates one comment and the next run edits it in place", () => {
  const issues = [epic(10, [11, 12]), task(11, 10, "closed"), task(12, 10)];
  const api = fakeApi();

  assert.deepEqual(syncProgress(issues, api), [{ number: 10, line: "1 of 2 done", action: "created" }]);
  assert.equal(api.state.comments.get(10).length, 1);

  assert.deepEqual(syncProgress(issues, api), [{ number: 10, line: "1 of 2 done", action: "unchanged" }]);
  assert.equal(api.state.comments.get(10).length, 1, "no duplicate comment");
});

test("the line survives a roadmap sync: body markers first, then a stable comment", () => {
  const issues = [epic(10, [11, 12]), task(11, 10, "closed"), task(12, 10)];
  const api = fakeApi();

  // A body that carries the markers is the preferred place, and a stale line is corrected.
  issues[0].body = withProgress(epicBody([11, 12]), progressBlock("0 of 2 done"));
  assert.deepEqual(syncProgress(issues, api), [{ number: 10, line: "1 of 2 done", action: "body" }]);
  assert.ok(api.state.issues.get(10).includes(progressBlock("1 of 2 done")));
  assert.equal(api.state.comments.get(10), undefined);

  // The roadmap sync regenerates the body from ROADMAP.md and drops the block.
  issues[0].body = epicBody([11, 12]);
  assert.deepEqual(syncProgress(issues, api), [{ number: 10, line: "1 of 2 done", action: "created" }]);

  // Another sync, then another task closes: the same comment is edited, never duplicated.
  issues[0].body = epicBody([11, 12]);
  issues[2].state = "closed";
  assert.deepEqual(syncProgress(issues, api), [{ number: 10, line: "2 of 2 done", action: "updated" }]);
  assert.equal(api.state.comments.get(10).length, 1);
  assert.equal(api.state.comments.get(10)[0].body, progressBlock("2 of 2 done"));
});

test("an existing comment keeps its other text when the block is edited", () => {
  const issues = [epic(10, [11]), task(11, 10, "closed")];
  const api = fakeApi();
  api.state.comments.set(10, [{ id: 7, body: `Weekly note\n\n${progressBlock("0 of 1 done")}` }]);

  assert.deepEqual(syncProgress(issues, api), [{ number: 10, line: "1 of 1 done", action: "updated" }]);
  assert.equal(api.state.comments.get(10)[0].body, `Weekly note\n\n${progressBlock("1 of 1 done")}`);
});

test("a dry run reads comments and writes nothing", () => {
  const api = fakeApi();
  const results = syncProgress([epic(10, [11]), task(11, 10)], api, { dryRun: true });
  assert.deepEqual(results, [{ number: 10, line: "0 of 1 done", action: "would-create" }]);
  assert.deepEqual(api.state.calls, []);
});
