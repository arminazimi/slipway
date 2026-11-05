// When CI fails on an agent pull request, comment the failing step's last 80 log
// lines and the command to run locally. `.github/workflows/ops-ci-feedback.yml`
// runs this on `workflow_run` for `ci`; the workflow always uses the default
// branch's copy, never the pull request's, and this script reads the API with
// `gh` instead of checking out the pull request.
//
//   node tools/ops/ci-feedback.mjs
//
// The helpers below are pure, so ci-feedback.test.mjs can run them offline on a
// recorded job log.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Lines of the failing step kept in the comment. */
export const LIMIT = 80;

/** A single log line longer than this is cut, so 80 lines stay inside GitHub's comment limit. */
const MAX_LINE = 500;

/** The timestamp the job-log API puts before every line. */
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z ?/;

/** Steps in API logs are `##[group]` blocks; zip logs use `##[section]` markers. */
const GROUP_START = /^##\[group\](.*)$/;
const GROUP_END = /^##\[endgroup\]\s*$/;
const SECTION_START = /^##\[section\]Starting:\s*(.*)$/;
const SECTION_END = /^##\[section\]Finishing:\s*(.*)$/;

/** Workflow commands on a log line; `##[error]` and friends are dropped from the snippet. */
const LOG_PREFIX = /^##\[(?:error|warning|notice|debug|command)\]/;
const STEP_MARKER = /^##\[(?:group|endgroup|section)\]/;

/** A line that can be run locally as is. */
const COMMAND = /^(?:npm|npx|node|pnpm|yarn|bundle|ruby|python3?|pip3?|gh|git|make|bash|sh)(?:\s|$)|^\.\//;

const untime = (line) => line.replace(TIMESTAMP, "");

/** The step blocks in a raw job log, in order. */
export function parseSteps(text) {
  const lines = text.split(/\r?\n/).map(untime);
  return lines.some((line) => SECTION_START.test(line) || SECTION_END.test(line)) ? sections(lines) : groups(lines);
}

function sections(lines) {
  const steps = [];
  let current = null;
  for (const line of lines) {
    const start = line.match(SECTION_START);
    const end = line.match(SECTION_END);
    if (start) {
      if (current) steps.push(current);
      current = { name: start[1].trim(), lines: [] };
    } else if (end) {
      if (current) steps.push(current);
      current = null;
    } else if (current) {
      current.lines.push(line);
    }
  }
  if (current) steps.push(current);
  return steps;
}

// A command may open its own `##[group]`; track the depth so that group does not
// become a separate step.
function groups(lines) {
  const steps = [];
  let current = null;
  let depth = 0;
  for (const line of lines) {
    const start = line.match(GROUP_START);
    if (start) {
      if (!current) {
        current = { name: start[1].trim() || "step", lines: [] };
        depth = 0;
      } else {
        depth += 1;
      }
      continue;
    }
    if (GROUP_END.test(line)) {
      if (!current) continue;
      if (depth > 0) depth -= 1;
      else {
        steps.push(current);
        current = null;
      }
      continue;
    }
    if (current) current.lines.push(line);
  }
  if (current) steps.push(current);
  return steps;
}

const normalizeName = (name) => (name ?? "").toLowerCase().replace(/^run\s+/, "").replace(/\s+/g, " ").trim();

const sameStep = (logName, wanted) => {
  const [a, b] = [normalizeName(logName), normalizeName(wanted)];
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
};

const shorten = (line) => (line.length > MAX_LINE ? `${line.slice(0, MAX_LINE)}...` : line);

function trimmed(lines) {
  let [start, end] = [0, lines.length];
  while (start < end && lines[start].trim() === "") start += 1;
  while (end > start && lines[end - 1].trim() === "") end -= 1;
  return lines.slice(start, end);
}

/** The command a reader would run locally: the `Run ...` step name, else the first command line. */
export function localCommand(step) {
  const run = (step.name ?? "").match(/^Run\s+(.+)$/i)?.[1]?.trim();
  if (run && COMMAND.test(run)) return run;
  for (const raw of step.lines ?? []) {
    const line = untime(raw).trim();
    if (COMMAND.test(line)) return line;
  }
  return "npm run check";
}

/**
 * The failing step and its last LIMIT lines. `stepName` is the failing step from
 * the jobs API; without it, or when the log names the step differently, the last
 * step that reported an error wins.
 */
export function extractFailure(text, { stepName = null } = {}) {
  const steps = parseSteps(text);
  let step = stepName ? steps.find((candidate) => sameStep(candidate.name, stepName)) : null;
  step ??= steps.filter((candidate) => candidate.lines.some((line) => /^##\[error\]/i.test(line))).at(-1);
  step ??= steps.filter((candidate) => candidate.lines.some((line) => /\bexit code [1-9]\d*\b/i.test(line))).at(-1);
  step ??= steps.at(-1);
  const source = step ?? { name: stepName ?? "the failing step", lines: text.split(/\r?\n/) };
  const lines = trimmed(
    source.lines
      .map((line) => untime(line).replace(LOG_PREFIX, "").replace(/\s+$/, ""))
      .filter((line) => !STEP_MARKER.test(line))
      .map(shorten),
  ).slice(-LIMIT);
  return { name: source.name, lines, command: localCommand(source) };
}

/** The hidden marker that makes a comment unique to one attempt of one run. */
export function feedbackMarker(run) {
  return `<!-- slipway-ci-feedback: run=${run.id}, attempt=${run.run_attempt ?? 1} -->`;
}

/** The existing feedback comment for this run attempt, if any. */
export function findFeedback(comments, run) {
  const marker = feedbackMarker(run);
  return comments.find((comment) => (comment.body ?? "").includes(marker)) ?? null;
}

/** A Markdown fence longer than any run of backticks in the snippet. */
export function fenceFor(lines) {
  let longest = 0;
  for (const line of lines) {
    for (const ticks of line.match(/`+/g) ?? []) longest = Math.max(longest, ticks.length);
  }
  return "`".repeat(Math.max(3, longest + 1));
}

const inline = (value) => `\`${String(value ?? "").replace(/`/g, "'").replace(/\s+/g, " ").trim()}\``;

/** The collapsed comment. */
export function commentBody({ run, job, step, lines, command }) {
  const fence = fenceFor(lines);
  return [
    feedbackMarker(run),
    `**CI failed** in ${inline(job.name ?? "a job")} / ${inline(step.name)} on [run ${run.id}](${run.html_url ?? ""}).`,
    "",
    "Run this locally:",
    "",
    "```bash",
    command,
    "```",
    "",
    `<details><summary>Last ${lines.length} lines of the failing step</summary>`,
    "",
    `${fence}text`,
    ...lines,
    fence,
    "",
    "</details>",
  ].join("\n");
}

const BOT = /\[bot\]$/i;
const AGENT = /(?:^|[-_ ])(?:agent|bot|claude|codex|copilot|cursor|devin|openhands|aider)(?:$|[-_ ])/i;

/** A pull request labeled for agents, or authored by a bot or a known agent account. */
export function isAgentPullRequest(pull) {
  const labels = (pull.labels ?? []).map((label) => (typeof label === "string" ? label : (label?.name ?? "")));
  if (labels.some((name) => /agent|bot/i.test(name))) return true;
  const login = pull.user?.login ?? pull.author?.login ?? "";
  return BOT.test(login) || AGENT.test(login);
}

function defaultGh(args) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    maxBuffer: 1e8,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function ghList(gh, path) {
  const pages = JSON.parse(gh(["api", path, "--paginate", "--slurp"]));
  return Array.isArray(pages) ? pages.flat() : [pages];
}

function pullNumber(run, repo, gh) {
  const known = (run.pull_requests ?? []).map((pull) => pull.number).find(Number.isInteger);
  if (known) return known;
  if (!run.head_sha) return null;
  const pulls = ghList(gh, `repos/${repo}/commits/${run.head_sha}/pulls`);
  const open = pulls.filter((pull) => pull.state === "open");
  return (open.find((pull) => pull.head?.sha === run.head_sha) ?? open[0])?.number ?? null;
}

/**
 * The workflow entry point. Returns `{ commented, reason }` instead of throwing for
 * events that need no comment, so a retried workflow exits cleanly.
 */
export function main({ env = process.env, gh = defaultGh, log = console } = {}) {
  const skip = (reason) => {
    log.log(`ci-feedback: ${reason}`);
    return { commented: false, reason };
  };

  if (!env.GITHUB_EVENT_PATH) return skip("GITHUB_EVENT_PATH is not set");
  let payload;
  try {
    payload = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"));
  } catch {
    return skip("cannot read the event payload");
  }

  const run = payload.workflow_run;
  if (!run) return skip("not a workflow_run event");
  if (run.conclusion !== "failure") return skip(`run ${run.id} did not fail`);
  if (run.event && run.event !== "pull_request") return skip(`run ${run.id} is not from a pull request`);

  const repo = payload.repository?.full_name ?? env.GITHUB_REPOSITORY;
  if (!repo) return skip("no repository in the event");

  const number = pullNumber(run, repo, gh);
  if (!number) return skip(`run ${run.id} has no pull request`);
  const pull = JSON.parse(gh(["api", `repos/${repo}/pulls/${number}`]));
  if (pull.state && pull.state !== "open") return skip(`pull request #${number} is ${pull.state}`);
  if (!isAgentPullRequest(pull)) return skip(`pull request #${number} is not from an agent`);

  const jobs = ghList(gh, `repos/${repo}/actions/runs/${run.id}/jobs?per_page=100`);
  const job = jobs.find((candidate) => candidate.conclusion === "failure");
  if (!job) return skip(`run ${run.id} has no failed job`);

  let text;
  try {
    text = gh(["api", `repos/${repo}/actions/jobs/${job.id}/logs`]);
  } catch {
    return skip(`the log for job ${job.id} is not ready`);
  }

  const stepName = (job.steps ?? []).find((step) => step.conclusion === "failure")?.name ?? null;
  const failure = extractFailure(text, { stepName });
  if (failure.lines.length === 0) return skip(`the log for job ${job.id} is empty`);

  const body = commentBody({
    run,
    job,
    step: { name: stepName ?? failure.name },
    lines: failure.lines,
    command: failure.command,
  });

  const comments = ghList(gh, `repos/${repo}/issues/${number}/comments?per_page=100`);
  if (findFeedback(comments, run)) return skip(`run ${run.id} already has a feedback comment`);

  gh(["api", `repos/${repo}/issues/${number}/comments`, "-X", "POST", "-f", `body=${body}`]);
  log.log(`ci-feedback: commented on #${number} for run ${run.id}`);
  return { commented: true, number, body };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (error) {
    const detail = String(error.stderr ?? "").trim() || error.message;
    console.error(`ci-feedback: ${detail}`);
    process.exitCode = 1;
  }
}
