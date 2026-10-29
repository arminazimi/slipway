import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { buildIssues, loadBriefs } from "./build.mjs";
import { parseRoadmap } from "./parse.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const real = readFileSync(join(here, "..", "..", "ROADMAP.md"), "utf8");

// The sample is a partial roadmap: skip whole-roadmap completeness checks.
const PARTIAL = { done: {}, strict: false };

const SAMPLE = `
| Phase | Dates | Theme | Release |
|---|---|---|---|
| Phase 0 | 2026-10-19 → 2026-11-01 | Foundations | none |

\`\`\`\`markdown
<!-- slipway-roadmap-key: ignored.example -->
## Epic: Inside a fence
\`\`\`\`

# Phase 0 — Foundations (2026-10-19 → 2026-11-01)

## Epic: Repository
<!-- slipway-roadmap-key: E-foundation -->
> **Epic** · **Phase:** Phase 0 — Foundations (2026-10-19 → 2026-11-01) · **Track:** verify

### Outcome
A repository people can contribute to.

### Scope
- One check command

### Tasks
| Key | Task | Lane | Size | Depends |
|---|---|---|---|---|
| \`foundation.layout\` | Create the layout | strong-agent | S | none |
| \`foundation.check\` | Add the check | free-agent | XS | \`foundation.layout\` |

### Exit criteria
- [ ] Check passes.

# Metrics
`;

test("parses phases, epics, and tasks, and ignores fenced examples", () => {
  const { phases, epics, tasks, errors } = parseRoadmap(SAMPLE);
  assert.deepEqual(errors, []);
  assert.equal(phases.length, 1);
  assert.deepEqual(phases[0], { id: "Phase 0", start: "2026-10-19", end: "2026-11-01", title: "Foundations", release: "none" });
  assert.equal(epics.length, 1);
  assert.equal(epics[0].key, "E-foundation");
  assert.equal(epics[0].track, "verify");
  assert.equal(epics[0].outcome, "A repository people can contribute to.");
  assert.deepEqual(epics[0].scope, ["One check command"]);
  assert.deepEqual(epics[0].exit, ["Check passes."]);
  assert.deepEqual(
    tasks.map((t) => [t.key, t.lane, t.size, t.deps, t.epic]),
    [
      ["foundation.layout", "strong-agent", "S", [], "E-foundation"],
      ["foundation.check", "free-agent", "XS", ["foundation.layout"], "E-foundation"],
    ],
  );
});

test("a release milestone such as v1.2 works like a phase", () => {
  const release = SAMPLE.replace("| Phase 0 | 2026-10-19", "| v1.2 | 2026-10-19").replace("# Phase 0 — ", "# v1.2 — ");
  const { phases, epics, errors } = parseRoadmap(release);
  assert.deepEqual(errors, []);
  assert.deepEqual(phases.map((p) => p.id), ["v1.2"]);
  assert.equal(epics[0].phase, "v1.2");
});

test("a lettered phase such as Phase 0a is its own phase", () => {
  const lettered = SAMPLE.replace("| Phase 0 | 2026-10-19", "| Phase 0a | 2026-10-19").replace("# Phase 0 — ", "# Phase 0a — ");
  const { phases, epics, errors } = parseRoadmap(lettered);
  assert.deepEqual(errors, []);
  assert.deepEqual(phases.map((p) => p.id), ["Phase 0a"]);
  assert.equal(epics[0].phase, "Phase 0a");
});

test("builds labels and bodies with unresolved references for apply.mjs", () => {
  const { issues, errors } = buildIssues(SAMPLE, new Map(), PARTIAL);
  assert.deepEqual(errors, []);
  const check = issues.find((i) => i.key === "foundation.check");
  assert.ok(check.labels.includes("lane: free-agent"));
  assert.ok(check.labels.includes("size: XS"));
  assert.ok(check.labels.includes("help wanted"));
  assert.ok(!check.labels.includes("good first issue"), "good first issue requires a brief");
  assert.match(check.body, /<!-- slipway-roadmap-key: foundation\.check -->/);
  assert.match(check.body, /## Depends on\n- \{\{ref:foundation\.layout\}\}/);
  const epic = issues.find((i) => i.key === "E-foundation");
  assert.equal(epic.title, "Epic: Repository");
  assert.match(epic.body, /- \[ \] \{\{ref:foundation\.layout\}\}/);
});

test("a brief replaces the generic section and earns good first issue", () => {
  const briefs = new Map([["foundation.check", "## Goal\nAdd it.\n\n## Done when\n- [ ] It runs."]]);
  const { issues, errors } = buildIssues(SAMPLE, briefs, PARTIAL);
  assert.deepEqual(errors, []);
  const check = issues.find((i) => i.key === "foundation.check");
  assert.ok(check.labels.includes("good first issue"));
  assert.ok(!check.labels.includes("status: needs-brief"));
  assert.match(check.body, /## Goal\nAdd it\./);
  assert.doesNotMatch(check.body, /no detailed brief yet/);
});

test("reports unknown dependencies, bad lanes, and cycles", () => {
  const broken = SAMPLE.replace("| strong-agent | S | none |", "| robot | L | `foundation.check` |").replace(
    "| `foundation.layout` |\n",
    "| `missing.task` |\n",
  );
  const { errors } = buildIssues(broken, new Map(), PARTIAL);
  assert.ok(errors.some((e) => e.includes('unknown lane "robot"')));
  assert.ok(errors.some((e) => e.includes("size must be XS, S, or M")));
  assert.ok(errors.some((e) => e.includes("unknown dependency missing.task")));
});

test("detects dependency cycles", () => {
  const cyclic = SAMPLE.replace("| strong-agent | S | none |", "| strong-agent | S | `foundation.check` |");
  const { errors } = buildIssues(cyclic, new Map(), PARTIAL);
  assert.ok(errors.some((e) => e.startsWith("dependency cycle")));
});

test("the real ROADMAP.md and briefs build without errors", () => {
  const { issues, errors, stats } = buildIssues(real, loadBriefs());
  assert.deepEqual(errors, []);
  assert.ok(stats.epics >= 14);
  assert.ok(stats.tasks >= 90);
  for (const issue of issues) assert.ok(issue.title.length <= 256, `${issue.key}: title too long for GitHub`);
  for (const issue of issues) assert.ok(issue.body.length < 65_000, `${issue.key}: body too long for GitHub`);
});

test("every issue transferred from Seaworthy has its key in the roadmap", async () => {
  const { TRANSFER_FROM } = await import("./status.mjs");
  const { issues } = buildIssues(real, loadBriefs());
  const keys = new Set(issues.map((i) => i.key));
  assert.equal(Object.keys(TRANSFER_FROM.issues).length, 29);
  for (const key of Object.keys(TRANSFER_FROM.issues)) assert.ok(keys.has(key), `${key} is missing from ROADMAP.md`);
});

test("tasks that wait on Seaworthy are labeled", () => {
  const { issues } = buildIssues(real, loadBriefs());
  const label = (key) => issues.find((i) => i.key === key).labels;
  assert.ok(label("theme.action").includes("needs: seaworthy"));
  assert.ok(!label("sourcemap.contract").includes("needs: seaworthy"));
  assert.ok(!label("agent.edit-button").includes("needs: seaworthy"));
  assert.ok(label("agent.verified-gate").includes("needs: seaworthy"));
  assert.ok(!label("theme.tokens").includes("needs: seaworthy"));
});
