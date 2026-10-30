import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import {
  LIMIT,
  commentBody,
  extractFailure,
  feedbackMarker,
  findFeedback,
  isAgentPullRequest,
  main,
  parseSteps,
} from "./ci-feedback.mjs";

// Recorded from a failing `ci` / check (pages) job: raw job-log API text with its
// timestamps and `##[group]` markers. The failing step has 90 lines after the
// markers are dropped, so the comment keeps exactly its last 80.
const stamp = "2026-10-30T09:14:00.0000000Z";
const line = (text) => `${stamp} ${text}`;
const recorded = [
  line("##[group]Set up job"),
  line("Current runner version: '2.331.0'"),
  line("##[endgroup]"),
  line("##[group]Run npm ci"),
  line("npm ci"),
  line("added 412 packages in 9s"),
  line("##[endgroup]"),
  line("##[group]Run npm run check"),
  line("npm run check"),
  line("shell: /usr/bin/bash -e {0}"),
  line("env:"),
  line("  SLIPWAY_REQUIRE_BUILD: 1"),
  line("##[group]Fixture details"),
  ...Array.from({ length: 84 }, (_, index) => line(`checked fixture ${index + 1}`)),
  line("##[endgroup]"),
  line("Error: examples/minimal/sourcemap.json is stale"),
  line("##[error]Process completed with exit code 1."),
  line("##[endgroup]"),
  line("##[group]Complete job"),
  line("Cleaning up orphan processes"),
  line("##[endgroup]"),
].join("\n");

test("extracts the failing step and keeps its last 80 lines", () => {
  const failure = extractFailure(recorded, { stepName: "Run npm run check" });
  assert.equal(failure.name, "Run npm run check");
  assert.equal(failure.command, "npm run check");
  assert.equal(failure.lines.length, LIMIT);
  assert.equal(failure.lines[0], "checked fixture 7", "the step's first lines are cut");
  assert.equal(failure.lines.at(-1), "Process completed with exit code 1.");
  assert.ok(!failure.lines.includes("npm run check"));
  assert.ok(!failure.lines.some((entry) => entry.includes("added 412 packages")), "a passing step is not included");
});

test("finds the failing step when the API step name differs", () => {
  const failure = extractFailure(recorded, { stepName: "Upgrade test" });
  assert.equal(failure.name, "Run npm run check");
  assert.equal(failure.lines.at(-1), "Process completed with exit code 1.");
});

test("nested command groups stay inside their step", () => {
  assert.deepEqual(
    parseSteps(recorded).map((step) => step.name),
    ["Set up job", "Run npm ci", "Run npm run check", "Complete job"],
  );
});

test("reads zip-style section logs", () => {
  const log = [
    "##[section]Starting: Run npm ci",
    "npm ci",
    "##[section]Finishing: Run npm ci",
    "##[section]Starting: Run npm run check",
    "npm run check",
    "boom",
    "##[error]Process completed with exit code 1.",
    "##[section]Finishing: Run npm run check",
  ].join("\n");
  const failure = extractFailure(log, { stepName: "Run npm run check" });
  assert.equal(failure.name, "Run npm run check");
  assert.deepEqual(failure.lines, ["npm run check", "boom", "Process completed with exit code 1."]);
});

test("one feedback comment per failing run", () => {
  const run = { id: 100, run_attempt: 1 };
  const existing = { id: 7, body: `Thanks\n${feedbackMarker(run)}\nlog` };
  assert.equal(findFeedback([], run), null);
  assert.equal(findFeedback([{ id: 1, body: "no marker" }], run), null);
  assert.equal(findFeedback([existing, { id: 2, body: "later" }], run), existing);
  assert.equal(findFeedback([existing], { id: 100, run_attempt: 2 }), null, "a new attempt gets its own comment");
});

test("an agent label or bot author marks the pull request", () => {
  assert.equal(isAgentPullRequest({ user: { login: "codex[bot]" }, labels: [] }), true);
  assert.equal(isAgentPullRequest({ user: { login: "someone" }, labels: [{ name: "lane: strong-agent" }] }), true);
  assert.equal(isAgentPullRequest({ user: { login: "maintainer" }, labels: [{ name: "bug" }] }), false);
});

test("a log line with backticks does not close the code fence", () => {
  const body = commentBody({
    run: { id: 1, run_attempt: 1, html_url: "https://example.test/run/1" },
    job: { name: "check" },
    step: { name: "Run npm run check" },
    lines: ["```", "error"],
    command: "npm run check",
  });
  assert.match(body, /````text\n```\nerror\n````/);
});

const recordedEvent = (overrides = {}) => ({
  repository: { full_name: "arminazimi/slipway" },
  workflow_run: {
    id: 100,
    run_attempt: 1,
    name: "ci",
    event: "pull_request",
    conclusion: "failure",
    html_url: "https://github.com/arminazimi/slipway/actions/runs/100",
    head_sha: "abc123",
    pull_requests: [{ number: 42 }],
    ...overrides,
  },
});

const job = {
  id: 500,
  name: "check (pages)",
  conclusion: "failure",
  steps: [
    { name: "Set up job", status: "completed", conclusion: "success" },
    { name: "Run npm ci", status: "completed", conclusion: "success" },
    { name: "Run npm run check", status: "completed", conclusion: "failure" },
  ],
};

/** A `gh` stand-in serving the recorded API responses, plus the comments it posts. */
function harness({ event = recordedEvent(), pull = { number: 42, state: "open", user: { login: "codex[bot]" }, labels: [] } } = {}) {
  const directory = mkdtempSync(join(tmpdir(), "slipway-ci-feedback-"));
  const eventPath = join(directory, "event.json");
  writeFileSync(eventPath, JSON.stringify(event));
  const comments = [];
  const calls = [];
  const gh = (args) => {
    calls.push(args.join(" "));
    const path = args[1];
    if (path === "repos/arminazimi/slipway/pulls/42") return JSON.stringify(pull);
    if (path === "repos/arminazimi/slipway/actions/runs/100/jobs?per_page=100") return JSON.stringify([[job]]);
    if (path === "repos/arminazimi/slipway/actions/jobs/500/logs") return recorded;
    if (path === "repos/arminazimi/slipway/issues/42/comments?per_page=100") return JSON.stringify([comments]);
    if (path === "repos/arminazimi/slipway/issues/42/comments" && args.includes("POST")) {
      const body = args[args.indexOf("-f") + 1].replace(/^body=/, "");
      comments.push({ id: comments.length + 1, body });
      return JSON.stringify({ id: comments.length });
    }
    throw new Error(`unexpected gh call: ${args.join(" ")}`);
  };
  return {
    env: { ...process.env, GITHUB_EVENT_PATH: eventPath, GITHUB_REPOSITORY: "arminazimi/slipway" },
    gh,
    log: { log() {} },
    comments,
    calls,
  };
}

test("comments once per failing run, with the command and a collapsed log", () => {
  const fake = harness();
  const first = main(fake);
  assert.equal(first.commented, true);
  assert.equal(fake.comments.length, 1);

  const body = fake.comments[0].body;
  assert.match(body, /<!-- slipway-ci-feedback: run=100, attempt=1 -->/);
  assert.match(body, /Run this locally:\n\n```bash\nnpm run check\n```/);
  assert.match(body, /<details><summary>Last 80 lines of the failing step<\/summary>/);
  assert.match(body, /Process completed with exit code 1\./);
  assert.doesNotMatch(body, /added 412 packages/);

  const second = main(fake);
  assert.equal(second.commented, false);
  assert.match(second.reason, /already/);
  assert.equal(fake.comments.length, 1, "a retried workflow does not post twice");
  assert.equal(fake.calls.filter((call) => call.includes("-X POST")).length, 1);
});

test("leaves a human pull request alone", () => {
  const fake = harness({ pull: { number: 42, state: "open", user: { login: "maintainer" }, labels: [{ name: "bug" }] } });
  const result = main(fake);
  assert.equal(result.commented, false);
  assert.equal(fake.comments.length, 0);
  assert.ok(fake.calls.every((call) => !call.includes("POST")));
});

test("ignores a run that did not fail", () => {
  const fake = harness({ event: recordedEvent({ conclusion: "success" }) });
  assert.equal(main(fake).commented, false);
  assert.equal(fake.calls.length, 0);
});
