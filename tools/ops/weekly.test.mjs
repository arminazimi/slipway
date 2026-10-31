// The weekly report is computed from a fixture of events, never from GitHub, so
// the numbers are reproducible. The fixture was recorded by hand for the week of
// 2026-10-26 (last week) and 2026-10-19 (the week before).
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildReport,
  closingNumbers,
  isTask,
  median,
  medianReadyToMerge,
  readyAt,
  render,
  reportTitle,
  reported,
  weekRanges,
} from "./weekly.mjs";

const issue = (
  number,
  { state = "open", labels = ["roadmap"], body = "", created, closed = null, merged = null } = {},
) => ({
  number,
  state,
  labels: labels.map((name) => ({ name })),
  body,
  created_at: created,
  closed_at: closed,
  ...(merged === null ? {} : { pull_request: { merged_at: merged } }),
});

const roadmapBody = (key, deps = []) =>
  `<!-- slipway-roadmap-key: ${key} -->\n\n## Depends on\n${deps
    .map((n) => `- #${n}`)
    .join("\n")}\n\n---\n`;

const task = (number, options = {}) =>
  issue(number, {
    ...options,
    body: roadmapBody(`E-test-${number}`, options.deps ?? []),
  });

const run = (created, conclusion, status = "completed") => ({
  created_at: created,
  conclusion,
  status,
});

const issues = [
  // A plain issue can hold up a task without being a task itself.
  issue(120, { labels: [], state: "closed", created: "2026-10-01T00:00:00Z", closed: "2026-10-28T00:00:00Z" }),
  task(101, { state: "closed", created: "2026-10-24T00:00:00Z", closed: "2026-10-27T00:00:00Z" }),
  task(102, { state: "closed", created: "2026-10-25T00:00:00Z", closed: "2026-10-30T00:00:00Z", deps: [120] }),
  task(103, { state: "closed", created: "2026-10-20T00:00:00Z", closed: "2026-10-23T00:00:00Z" }),
  task(104, { created: "2026-10-29T00:00:00Z" }),
  task(105, {
    labels: ["roadmap", "type: epic"],
    state: "closed",
    created: "2026-10-01T00:00:00Z",
    closed: "2026-10-28T00:00:00Z",
  }),
  task(106, { state: "closed", created: "2026-10-30T00:00:00Z", closed: "2026-10-31T00:00:00Z" }),
  issue(201, { body: "Closes #101", created: "2026-10-24T01:00:00Z", merged: "2026-10-26T12:00:00Z" }),
  issue(202, { body: "Fixes #102", created: "2026-10-25T01:00:00Z", merged: "2026-10-30T12:00:00Z" }),
  issue(203, { body: "Closes #103", created: "2026-10-20T01:00:00Z", merged: "2026-10-22T00:00:00Z" }),
  issue(204, { body: "No linked task.", created: "2026-10-30T01:00:00Z", merged: "2026-10-31T00:00:00Z" }),
  issue(205, { body: "Closes #104", created: "2026-10-29T01:00:00Z" }),
];

const runs = [
  run("2026-10-19T01:00:00Z", "success"),
  run("2026-10-20T01:00:00Z", "failure"),
  run("2026-10-21T01:00:00Z", "success"),
  run("2026-10-22T01:00:00Z", "skipped"),
  run("2026-10-23T01:00:00Z", "success"),
  run("2026-10-26T01:00:00Z", "success"),
  run("2026-10-26T02:00:00Z", "failure"),
  run("2026-10-27T01:00:00Z", "success"),
  run("2026-10-27T05:00:00Z", null, "in_progress"),
  run("2026-10-28T01:00:00Z", "failure"),
  run("2026-10-28T02:00:00Z", "timed_out"),
  run("2026-10-29T01:00:00Z", "success"),
  run("2026-10-30T01:00:00Z", "failure"),
  run("2026-10-30T02:00:00Z", "success"),
  run("2026-10-31T01:00:00Z", "success"),
  run("2026-11-01T01:00:00Z", "cancelled"),
  run("2026-10-10T01:00:00Z", "failure"),
];

const now = new Date("2026-11-02T06:00:00Z");
const report = buildReport({ issues, runs }, now);

test("the fixture's numbers match hand-computed values", () => {
  assert.deepEqual(report, {
    last: {
      start: "2026-10-26",
      end: "2026-11-02",
      tasksClosed: 3,
      pullsMerged: 3,
      medianReadyToMergeDays: 2.5,
      medianSample: 2,
      ci: { runs: 9, failures: 4, rate: 4 / 9 },
    },
    previous: {
      start: "2026-10-19",
      end: "2026-10-26",
      tasksClosed: 1,
      pullsMerged: 1,
      medianReadyToMergeDays: 2,
      medianSample: 1,
      ci: { runs: 4, failures: 1, rate: 0.25 },
    },
  });
});

test("the report shows both weeks and explains each number", () => {
  assert.equal(reportTitle(report), "Weekly report: 2026-10-26");
  const text = render(report);
  assert.match(text, /^<!-- slipway-weekly: 2026-10-26 -->/);
  assert.match(text, /Numbers for 2026-10-26 to 2026-11-01, with the week before \(2026-10-19 to 2026-10-25\)/);
  assert.match(text, /\| Tasks closed \| 3 \| 1 \|/);
  assert.match(text, /\| Pull requests merged \| 3 \| 1 \|/);
  assert.match(text, /\| Median ready to merge \| 2\.5 days \(2 PRs\) \| 2 days \(1 PR\) \|/);
  assert.match(text, /\| CI failure rate \| 44\.4% \(4 of 9 runs\) \| 25% \(1 of 4 runs\) \|/);
  assert.match(text, /## How these are counted/);
});

test("weeks run Monday to Monday in UTC, whichever day the report runs", () => {
  const monday = weekRanges(new Date("2026-11-02T00:00:00Z"));
  const sunday = weekRanges(new Date("2026-11-08T23:59:00Z"));
  assert.deepEqual(monday.last, [Date.parse("2026-10-26T00:00:00Z"), Date.parse("2026-11-02T00:00:00Z")]);
  assert.deepEqual(sunday.last, monday.last);
  assert.deepEqual(sunday.previous, [Date.parse("2026-10-19T00:00:00Z"), Date.parse("2026-10-26T00:00:00Z")]);
});

test("the median averages the two middle values", () => {
  assert.equal(median([3, 1, 4, 2]), 2.5);
  assert.equal(median([7]), 7);
  assert.equal(median([]), null);
});

test("a pull request whose task still waits on an open dependency is left out of the median", () => {
  const blocked = [
    task(10, { created: "2026-10-20T00:00:00Z", deps: [11] }),
    issue(11, { labels: [], created: "2026-10-20T00:00:00Z" }),
    issue(20, { body: "Closes #10", created: "2026-10-20T01:00:00Z", merged: "2026-10-30T00:00:00Z" }),
    task(12, { created: "2026-10-28T00:00:00Z" }),
    issue(21, { body: "Closes #12", created: "2026-10-28T01:00:00Z", merged: "2026-10-29T00:00:00Z" }),
  ];
  const week = [Date.parse("2026-10-26T00:00:00Z"), Date.parse("2026-11-02T00:00:00Z")];
  assert.deepEqual(medianReadyToMerge(blocked, week), { days: 1, sample: 1 });
  assert.equal(readyAt(blocked[0], blocked), null);
});

test("a pull request merged before its task was ready is left out of the median", () => {
  const early = [
    task(30, { created: "2026-10-28T00:00:00Z" }),
    issue(40, { body: "Closes #30", created: "2026-10-28T01:00:00Z", merged: "2026-10-27T00:00:00Z" }),
  ];
  const week = [Date.parse("2026-10-26T00:00:00Z"), Date.parse("2026-11-02T00:00:00Z")];
  assert.deepEqual(medianReadyToMerge(early, week), { days: null, sample: 0 });
});

test("a linked issue counts once, and an epic is not a task", () => {
  assert.deepEqual(closingNumbers("Closes #1, fixes #2 and resolves https://github.com/x/y/issues/3"), [1, 2, 3]);
  assert.equal(isTask(issues[0]), false, "a plain issue is not a task");
  assert.equal(isTask(issues[4]), true);
  assert.equal(isTask(issues[5]), false, "an epic is not a task");
});

test("a week that already has a report is not opened again", () => {
  const existing = [
    issue(50, { labels: ["report"], body: "<!-- slipway-weekly: 2026-10-26 -->" }),
    issue(51, { labels: ["report"], body: "<!-- slipway-weekly: 2026-10-19 -->" }),
    issue(52, { labels: ["report"], body: "<!-- slipway-weekly: 2026-10-26 -->", merged: "2026-10-30T00:00:00Z" }),
  ];
  assert.equal(reported(existing, "2026-10-26").number, 50);
  assert.equal(reported(existing.slice(1), "2026-10-26"), undefined);
});
