import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { blocked, dependencies, inProgress, ready } from "./graph.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// Recorded from the repository on 2026-10-30: #666 (epic), #862 (depends on
// closed #850), #849 (depends on open #842), #842 (depends on open #840), #720
// (maintainer task), #805 (open issue) and #954 (open pull request closing
// #805).
const recorded = JSON.parse(readFileSync(join(here, "fixtures/issues.json"), "utf8"));
const numbers = (issues) => issues.map((issue) => issue.number);

const issue = (number, { state = "open", labels = ["roadmap"], body = "", pull = false } = {}) => ({
  number,
  state,
  labels: labels.map((name) => ({ name })),
  body,
  ...(pull ? { pull_request: { url: `https://api.github.com/repos/x/y/pulls/${number}` } } : {}),
});

const task = (number, deps = [], labels = ["roadmap"]) =>
  issue(number, {
    labels,
    body: `<!-- slipway-roadmap-key: E-test-${number} -->\n\n## Depends on\n${deps
      .map((n) => `- #${n}`)
      .join("\n")}\n\n---\n`,
  });

test("a task whose dependencies are closed is ready", () => {
  assert.deepEqual(numbers(ready(recorded)), [862]);
});

test("a task blocked by an open dependency is not ready and is listed as blocked", () => {
  assert.ok(!numbers(ready(recorded)).includes(849));
  assert.ok(numbers(blocked(recorded)).includes(849));
});

test("an epic is never ready and never blocked", () => {
  const all = [...ready(recorded), ...blocked(recorded)];
  assert.ok(!numbers(all).includes(666), "the epic is not a dispatchable task");
});

test("a maintainer task is never dispatched", () => {
  const all = [...ready(recorded), ...blocked(recorded)];
  assert.ok(!numbers(all).includes(720), "a maintainer task is not handed to an agent");
});

test("an open pull request that closes an issue puts it in progress", () => {
  assert.deepEqual(numbers(inProgress(recorded)), [805]);
  assert.ok(!numbers(ready(recorded)).includes(805), "a claimed task is not ready");
});

test("only open pull requests close an issue", () => {
  const issues = [
    task(10),
    issue(100, { state: "closed", body: "Closes #10", pull: true }),
    issue(101, { body: "Related to #10", pull: true }),
    issue(102, { body: "Fixes #10", pull: true }),
  ];
  assert.deepEqual(numbers(inProgress(issues)), [10]);
});

test("a dependency the input does not know is not assumed closed", () => {
  const issues = [task(20, [21])];
  assert.deepEqual(numbers(blocked(issues)), [20]);
  assert.deepEqual(numbers(ready(issues)), []);
});

test("a full issue URL counts as a dependency", () => {
  const issues = [
    issue(21, { state: "closed" }),
    issue(20, {
      body: "<!-- slipway-roadmap-key: E-test-20 -->\n\n## Depends on\n- https://github.com/arminazimi/slipway/issues/21\n",
    }),
  ];
  assert.deepEqual(dependencies(issues[1]), [21]);
  assert.deepEqual(numbers(ready(issues)), [20]);
});

test("only open issues carrying a roadmap key are nodes in the graph", () => {
  const issues = [
    issue(30, { body: "A plain issue with no key." }),
    issue(31, { state: "closed", body: "<!-- slipway-roadmap-key: E-test-31 -->" }),
    issue(32, { body: "<!-- slipway-roadmap-key: E-test-32 -->" }),
  ];
  assert.deepEqual(numbers(ready(issues)), [32]);
});

test("results are sorted by issue number", () => {
  const issues = [task(9), task(3), task(7)];
  assert.deepEqual(numbers(ready(issues)), [3, 7, 9]);
  assert.deepEqual(numbers(blocked([task(9, [1]), task(3, [1])])), [3, 9]);
});
