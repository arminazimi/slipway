import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { READY, main, plan } from "./ready.mjs";

const here = dirname(fileURLToPath(import.meta.url));
// Recorded from the repository on 2026-10-30: #666 (epic), #862 (depends on
// closed #850), #849 (depends on open #842), #842 (depends on open #840), #720
// (maintainer task), #805 (open issue claimed by pull request #954), and #954
// (open pull request closing #805).
const recorded = JSON.parse(readFileSync(join(here, "fixtures/issues.json"), "utf8"));

const issue = (number, { state = "open", labels = ["roadmap"], deps = [], body = "", pull = false } = {}) => ({
  number,
  state,
  labels: labels.map((name) => ({ name })),
  body: [body, deps.length ? `## Depends on\n${deps.map((n) => `- #${n}`).join("\n")}` : ""]
    .filter(Boolean)
    .join("\n\n"),
  ...(pull ? { pull_request: { url: `https://api.github.com/repos/x/y/pulls/${number}` } } : {}),
});

const task = (number, { labels = ["roadmap"], deps = [], ...rest } = {}) =>
  issue(number, { labels, deps, body: `<!-- slipway-roadmap-key: E-test-${number} -->`, ...rest });

const recorder = () => {
  const calls = [];
  return {
    calls,
    gh(args) {
      calls.push(args);
      return "";
    },
  };
};

const quiet = { log() {} };

test("the recorded fixture only labels #862, which depends on closed #850", () => {
  assert.deepEqual(plan(recorded), { add: [862], remove: [] });
});

test("a ready task without the label gets it", () => {
  assert.deepEqual(plan([task(1)]), { add: [1], remove: [] });
});

test("a blocked task with the label loses it", () => {
  const issues = [task(2, { labels: ["roadmap", READY], deps: [3] }), task(3)];
  assert.deepEqual(plan(issues), { add: [3], remove: [2] });
});

test("a closed issue is never touched", () => {
  const issues = [task(4, { state: "closed", labels: ["roadmap", READY] }), task(5, { state: "closed" })];
  assert.deepEqual(plan(issues), { add: [], remove: [] });
});

test("an epic is never touched", () => {
  const issues = [
    task(6, { labels: ["roadmap", "type: epic"] }),
    task(7, { labels: ["roadmap", "type: epic", READY] }),
  ];
  assert.deepEqual(plan(issues), { add: [], remove: [] });
});

test("a plain issue without a roadmap key is never touched", () => {
  const issues = [
    issue(8, { body: "Not part of the roadmap." }),
    issue(9, { labels: ["roadmap", READY], body: "Not part of the roadmap." }),
  ];
  assert.deepEqual(plan(issues), { add: [], remove: [] });
});

test("a task claimed by an open pull request is not made ready", () => {
  const issues = [task(10), issue(110, { labels: [], body: "Closes #10", pull: true })];
  assert.deepEqual(plan(issues), { add: [], remove: [] });
});

test("a maintainer task is not handed to an agent", () => {
  const issues = [task(11, { labels: ["roadmap", "lane: maintainer"] })];
  assert.deepEqual(plan(issues), { add: [], remove: [] });
});

test("main changes each label with one call and leaves correct labels alone", () => {
  const { calls, gh } = recorder();
  const result = main({
    env: { GITHUB_REPOSITORY: "arminazimi/slipway" },
    gh,
    log: quiet,
    read: () => recorded,
  });

  assert.deepEqual(result, { added: [862], removed: [] });
  assert.deepEqual(calls, [
    ["api", "repos/arminazimi/slipway/issues/862/labels", "--method", "POST", "-f", `labels[]=${READY}`],
  ]);
});

test("main removes the label from a blocked task with one DELETE", () => {
  const issues = [
    task(20, { labels: ["roadmap", READY], deps: [21] }),
    task(21, { labels: ["roadmap", READY] }),
  ];
  const { calls, gh } = recorder();
  const result = main({ env: { GITHUB_REPOSITORY: "arminazimi/slipway" }, gh, log: quiet, read: () => issues });

  assert.deepEqual(result, { added: [], removed: [20] });
  assert.deepEqual(calls, [
    ["api", "repos/arminazimi/slipway/issues/20/labels/status%3A%20ready", "--method", "DELETE"],
  ]);
});

test("main makes no calls when every label is already correct", () => {
  const issues = [
    task(30, { labels: ["roadmap", READY] }),
    task(31, { labels: ["roadmap"], deps: [32] }),
    task(32, { labels: ["roadmap", READY] }),
    task(33, { state: "closed", labels: ["roadmap", READY] }),
    issue(34, { labels: ["roadmap", READY], body: "No roadmap key." }),
  ];
  const { calls, gh } = recorder();

  assert.deepEqual(
    main({ env: { GITHUB_REPOSITORY: "arminazimi/slipway" }, gh, log: quiet, read: () => issues }),
    { added: [], removed: [] },
  );
  assert.deepEqual(calls, []);
});

test("main reports a missing repository instead of calling the API", () => {
  const { calls, gh } = recorder();
  assert.deepEqual(main({ env: {}, gh, log: quiet, read: () => recorded }), { added: [], removed: [] });
  assert.deepEqual(calls, []);
});
