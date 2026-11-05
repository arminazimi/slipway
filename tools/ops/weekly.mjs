// Weekly report of the agent pipeline: one issue, labeled `report`, with the week
// that just ended next to the week before, so a change in throughput or CI health
// shows up as a number rather than a feeling.
//
//   node tools/ops/weekly.mjs [--today YYYY-MM-DD] [--repo owner/name]
//                             [--workflow ci.yml] [--dry-run]
//
// A week collects:
// - tasks closed: issues closed that week with a roadmap key, epics aside;
// - pull requests merged: every merge that landed that week;
// - median ready to merge: from the moment an issue's last dependency closed (or
//   the issue was opened, when it waits on nothing) to its pull request's merge;
// - CI failure rate: completed runs of the `ci` workflow that ended in success,
//   failure, timed out, or startup failure.
//
// GitHub is read once, at the edges: `readIssues` from `./github.mjs` and
// `readRuns`. `buildReport` and `render` take a fixture of events and never call
// the API, so the test is offline and deterministic.
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { dependencies, roadmapKey } from "./graph.mjs";
import { readIssues } from "./github.mjs";

const DAY = 86_400_000;
const VERDICTS = new Set(["success", "failure", "timed_out", "startup_failure"]);
const CLOSES =
  /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s*:?\s+(?:#(\d+)|https?:\/\/\S*?\/issues\/(\d+))/gi;
const REPO = "arminazimi/slipway";

const hasLabel = (issue, name) =>
  (issue.labels ?? []).some((l) => (typeof l === "string" ? l : l.name) === name);

const isoDay = (ms) => new Date(ms).toISOString().slice(0, 10);
const dayBefore = (day) => {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return isoDay(date.getTime());
};

const inRange = (value, [start, end]) => {
  const ms = Date.parse(value);
  return Number.isFinite(ms) && ms >= start && ms < end;
};

const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

const oneDecimal = (value) => value.toFixed(1).replace(/\.0$/, "");

const percent = (rate) => `${oneDecimal(rate * 100)}%`;

// Weeks start on Monday at 00:00 UTC. "Last week" ends at the start of the
// current week, so a run any day of the week reports complete weeks.
export function weekRanges(now = new Date()) {
  const date = new Date(now);
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  const end = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() - daysSinceMonday,
  );
  return {
    last: [end - 7 * DAY, end],
    previous: [end - 14 * DAY, end - 7 * DAY],
  };
}

export function isTask(issue) {
  return (
    !issue.pull_request && Boolean(roadmapKey(issue)) && !hasLabel(issue, "type: epic")
  );
}

// A pull request counts once, when it merged; `merged_at` is on its issue shape.
export function isMerged(issue, range) {
  return Boolean(issue.pull_request?.merged_at) && inRange(issue.pull_request.merged_at, range);
}

export function closingNumbers(body = "") {
  const numbers = [];
  for (const match of body.matchAll(CLOSES)) {
    numbers.push(Number(match[1] ?? match[2]));
  }
  return [...new Set(numbers)];
}

function index(issues) {
  return issues instanceof Map ? issues : new Map(issues.map((issue) => [issue.number, issue]));
}

// Ready: every dependency is closed; the latest closure wins. An issue that
// waits on nothing is ready when it opens. A dependency the input does not know
// or that is still open leaves the readiness unknown (null), never guessed.
export function readyAt(issue, issues) {
  const byNumber = index(issues);
  const opened = Date.parse(issue?.created_at);
  if (!Number.isFinite(opened)) return null;
  let ready = opened;
  for (const number of dependencies(issue)) {
    const dependency = byNumber.get(number);
    if (!dependency || dependency.state !== "closed" || !dependency.closed_at) return null;
    ready = Math.max(ready, Date.parse(dependency.closed_at));
  }
  return ready;
}

export function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

// One pull request per task: the first roadmap task it closes that the input
// knows. A pull request with no linked task, or one whose task was never
// unblocked, is left out of the median but still counted as merged.
export function medianReadyToMerge(issues, range) {
  const byNumber = index(issues);
  const days = [];
  for (const pull of issues) {
    if (!isMerged(pull, range)) continue;
    const merged = Date.parse(pull.pull_request.merged_at);
    const issue = closingNumbers(pull.body)
      .map((number) => byNumber.get(number))
      .find((candidate) => candidate && isTask(candidate));
    if (!issue) continue;
    const ready = readyAt(issue, byNumber);
    if (ready === null || merged < ready) continue;
    days.push((merged - ready) / DAY);
  }
  return { days: median(days), sample: days.length };
}

export function ciFailureRate(runs, range) {
  const completed = runs.filter(
    (run) =>
      run.status === "completed" &&
      inRange(run.created_at, range) &&
      VERDICTS.has(run.conclusion),
  );
  const failures = completed.filter((run) => run.conclusion !== "success").length;
  return {
    runs: completed.length,
    failures,
    rate: completed.length > 0 ? failures / completed.length : null,
  };
}

export function weekMetrics(issues, runs, range) {
  const medianMerge = medianReadyToMerge(issues, range);
  return {
    start: isoDay(range[0]),
    end: isoDay(range[1]),
    tasksClosed: issues.filter(
      (issue) => isTask(issue) && issue.state === "closed" && inRange(issue.closed_at, range),
    ).length,
    pullsMerged: issues.filter((issue) => isMerged(issue, range)).length,
    medianReadyToMergeDays: medianMerge.days,
    medianSample: medianMerge.sample,
    ci: ciFailureRate(runs, range),
  };
}

export function buildReport(events, now = new Date()) {
  const ranges = weekRanges(now);
  const issues = events.issues ?? [];
  const runs = events.runs ?? [];
  return {
    last: weekMetrics(issues, runs, ranges.last),
    previous: weekMetrics(issues, runs, ranges.previous),
  };
}

const medianCell = (week) => {
  if (week.medianSample === 0) return "n/a";
  const days = week.medianReadyToMergeDays;
  return `${oneDecimal(days)} ${days === 1 ? "day" : "days"} ` +
    `(${plural(week.medianSample, "PR", "PRs")})`;
};

const ciCell = (week) => {
  const { runs, failures, rate } = week.ci;
  if (runs === 0) return "n/a";
  return `${percent(rate)} (${failures} of ${plural(runs, "run", "runs")})`;
};

export function reportTitle(report) {
  return `Weekly report: ${report.last.start}`;
}

export function marker(weekStart) {
  return `<!-- slipway-weekly: ${weekStart} -->`;
}

export function render(report) {
  const { last, previous } = report;
  return [
    marker(last.start),
    `# Agent pipeline, week of ${last.start}`,
    "",
    `Numbers for ${last.start} to ${dayBefore(last.end)}, with the week before ` +
      `(${previous.start} to ${dayBefore(previous.end)}) for comparison.`,
    "",
    "| Metric | Last week | Week before |",
    "| --- | ---: | ---: |",
    `| Tasks closed | ${last.tasksClosed} | ${previous.tasksClosed} |`,
    `| Pull requests merged | ${last.pullsMerged} | ${previous.pullsMerged} |`,
    `| Median ready to merge | ${medianCell(last)} | ${medianCell(previous)} |`,
    `| CI failure rate | ${ciCell(last)} | ${ciCell(previous)} |`,
    "",
    "## How these are counted",
    "",
    "- **Tasks closed**: issues closed in the week that carry a roadmap key, epics aside.",
    "- **Pull requests merged**: every pull request whose merge landed in the week.",
    "- **Median ready to merge**: from the moment an issue's last dependency closed " +
      "(or the issue opened, if it waits on nothing) to its pull request's merge, over " +
      "merged pull requests that close a roadmap task. A pull request with no known task " +
      "or an unresolved dependency is left out; the count of measured pull requests is shown.",
    "- **CI failure rate**: completed runs of the `ci` workflow that ended in success, " +
      "failure, timed out, or startup failure. Cancelled, skipped, and in-progress runs " +
      "are left out.",
  ].join("\n");
}

// A week gets one report, open or closed; a rerun on the same Monday (or a
// manual dispatch later that week) never opens a second one.
export function reported(issues, weekStart) {
  return issues.find(
    (issue) =>
      !issue.pull_request &&
      hasLabel(issue, "report") &&
      (issue.body ?? "").includes(marker(weekStart)),
  );
}

function ghApi(path) {
  const text = execFileSync("gh", ["api", path, "--paginate", "--slurp"], {
    encoding: "utf8",
    maxBuffer: 1e8,
    stdio: ["ignore", "pipe", "pipe"],
  });
  return JSON.parse(text).flat();
}

export function readRuns(repo, from, to, workflow = "ci.yml") {
  const path =
    `repos/${repo}/actions/workflows/${workflow}/runs` +
    `?per_page=100&created=${encodeURIComponent(from)}..${encodeURIComponent(to)}`;
  return ghApi(path).flatMap((page) => page.workflow_runs ?? []);
}

function main() {
  const { values } = parseArgs({
    options: {
      today: { type: "string" },
      repo: { type: "string" },
      workflow: { type: "string" },
      "dry-run": { type: "boolean" },
    },
  });
  const repo = values.repo ?? process.env.GITHUB_REPOSITORY ?? REPO;
  const workflow = values.workflow ?? "ci.yml";
  const now = values.today ? new Date(`${values.today}T12:00:00Z`) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`--today is not a date: ${values.today}`);

  const ranges = weekRanges(now);
  const issues = readIssues(repo);
  const runs = readRuns(
    repo,
    new Date(ranges.previous[0]).toISOString(),
    new Date(ranges.last[1]).toISOString(),
    workflow,
  );
  const report = buildReport({ issues, runs }, now);
  const existing = reported(issues, report.last.start);
  if (existing) {
    console.log(`Week ${report.last.start} already has a report: ${existing.html_url ?? `#${existing.number}`}`);
    return;
  }

  const body = render(report);
  if (values["dry-run"]) {
    console.log(body);
    return;
  }
  const url = execFileSync(
    "gh",
    [
      "issue",
      "create",
      "--repo",
      repo,
      "--title",
      reportTitle(report),
      "--body",
      body,
      "--label",
      "report",
    ],
    { encoding: "utf8" },
  ).trim();
  console.log(url || `Opened ${reportTitle(report)}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
