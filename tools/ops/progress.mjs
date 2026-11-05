// Epic progress: keeps a "7 of 12 done" line current on every epic.
//
//   node tools/ops/progress.mjs            # print the line for every epic, change nothing
//   node tools/ops/progress.mjs --apply    # write it on GitHub
//
// The line lives between `<!-- progress -->` and `<!-- /progress -->` markers. The roadmap
// sync regenerates each epic body from ROADMAP.md, so a line in the body does not survive it;
// when the body has no markers the line goes in an issue comment that is edited in place. A
// comment is never touched by the sync, so the line stays correct across one.
//
// The epic's tasks are the issues listed under "## Tasks" in its body plus every issue whose
// header says "> **Epic:** #n", so an epic with a stale body still counts the right tasks.
// Requires: gh CLI authenticated with `repo` scope.

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { readIssues } from "./github.mjs";

const REPO = process.env.SLIPWAY_REPO ?? "arminazimi/slipway";

const OPEN = "<!-- progress -->";
const CLOSE = "<!-- /progress -->";
const BLOCK = /<!--\s*progress\s*-->[\s\S]*?<!--\s*\/progress\s*-->/;
const EPIC_LINK = /^>\s*\*\*Epic:\*\*\s*#(\d+)/m;
const TASKS = /^##\s+Tasks[ \t]*\r?\n([\s\S]*?)(?=\r?\n##\s|(?![\s\S]))/m;
const TASK_LINE = /^\s*-\s*\[[ xX]\]\s*#(\d+)\s*$/gm;

const isPull = (issue) => Boolean(issue.pull_request);
const label = (issue, name) =>
  (issue.labels ?? []).some((l) => (typeof l === "string" ? l : l.name) === name);
const isEpic = (issue) => label(issue, "type: epic");

/** The issue numbers under "## Tasks" in an epic body. */
export function taskRefs(body) {
  const section = body?.match(TASKS)?.[1];
  if (!section) return [];
  return [...section.matchAll(TASK_LINE)].map((m) => Number(m[1]));
}

/** The epic an issue belongs to, from the "> **Epic:** #n" header the roadmap writes. */
export function epicOf(issue) {
  const number = issue.body?.match(EPIC_LINK)?.[1];
  return number ? Number(number) : null;
}

/**
 * Every task number per epic number, from the epic's task list and from each task's header.
 * The union means a task added after the epic body was last synced still counts.
 * @returns {Map<number, number[]>}
 */
export function epicTasks(issues) {
  const children = new Map();
  const add = (epic, task) => {
    const list = children.get(epic) ?? [];
    if (!list.includes(task)) list.push(task);
    children.set(epic, list);
  };
  for (const issue of issues.filter((i) => !isPull(i))) {
    const epic = epicOf(issue);
    if (epic) add(epic, issue.number);
    if (isEpic(issue)) for (const task of taskRefs(issue.body)) add(issue.number, task);
  }
  for (const list of children.values()) list.sort((a, b) => a - b);
  return children;
}

/**
 * The progress line of every epic that has tasks, sorted by issue number.
 * A task counts as done when its issue is closed; a task missing from the input (a
 * truncated read) counts as not done rather than silently shrinking the total.
 * @returns {Array<{epic: object, done: number, total: number, line: string}>}
 */
export function computeProgress(issues) {
  const issuesOnly = issues.filter((i) => !isPull(i));
  const byNumber = new Map(issuesOnly.map((i) => [i.number, i]));
  const children = epicTasks(issuesOnly);
  return issuesOnly
    .filter(isEpic)
    .sort((a, b) => a.number - b.number)
    .map((epic) => {
      const tasks = children.get(epic.number) ?? [];
      const done = tasks.filter((n) => byNumber.get(n)?.state === "closed").length;
      return { epic, done, total: tasks.length, line: `${done} of ${tasks.length} done` };
    })
    .filter((progress) => progress.total > 0);
}

/** The marker block, which renders as one bold line. */
export function progressBlock(line) {
  return [OPEN, `**${line}**`, CLOSE].join("\n");
}

/** Replaces the block in `text`, or puts one at the top (after the roadmap key, if present). */
export function withProgress(text, block) {
  const body = text ?? "";
  if (BLOCK.test(body)) return body.replace(BLOCK, block);
  const lines = body.split("\n");
  const at = /^<!--\s*slipway-roadmap-key:/.test(lines[0] ?? "") ? 1 : 0;
  const rest = lines.slice(at);
  while (rest[0] === "") rest.shift();
  return [...lines.slice(0, at), block, "", ...rest].join("\n");
}

/** The comment that holds the progress block, if any. */
export function progressComment(comments) {
  return (comments ?? []).find((comment) => BLOCK.test(comment.body ?? ""));
}

/**
 * Writes the line for every epic through `api`:
 * `{ comments(n), createComment(n, body), updateComment(id, body), updateIssue(n, body) }`.
 * The body wins when it already carries the markers; otherwise the comment is created once and
 * edited in place on every later run. With `dryRun`, reads still happen and nothing is written.
 * @returns {Array<{number: number, line: string, action: string}>}
 */
export function syncProgress(issues, api, { dryRun = false } = {}) {
  const results = [];
  for (const { epic, line } of computeProgress(issues)) {
    const block = progressBlock(line);
    if (BLOCK.test(epic.body ?? "")) {
      const body = withProgress(epic.body, block);
      if (body === epic.body) {
        results.push({ number: epic.number, line, action: "unchanged" });
      } else {
        if (!dryRun) api.updateIssue(epic.number, body);
        results.push({ number: epic.number, line, action: dryRun ? "would-update-body" : "body" });
      }
      continue;
    }

    const found = progressComment(api.comments(epic.number));
    if (!found) {
      if (!dryRun) api.createComment(epic.number, block);
      results.push({ number: epic.number, line, action: dryRun ? "would-create" : "created" });
      continue;
    }
    const body = withProgress(found.body, block);
    if (body === found.body) {
      results.push({ number: epic.number, line, action: "unchanged" });
    } else {
      if (!dryRun) api.updateComment(found.id, body);
      results.push({ number: epic.number, line, action: dryRun ? "would-update" : "updated" });
    }
  }
  return results;
}

function gh(path, method = "GET", body, paginate = false) {
  const args = ["api", path];
  if (method !== "GET") args.push("-X", method);
  if (paginate) args.push("--paginate", "--slurp");
  if (body !== undefined) args.push("--input", "-");
  const text = execFileSync("gh", args, {
    encoding: "utf8",
    input: body === undefined ? undefined : JSON.stringify(body),
    maxBuffer: 1e8,
    stdio: ["pipe", "pipe", "pipe"],
  });
  if (!text.trim()) return null;
  const parsed = JSON.parse(text);
  return paginate ? parsed.flat() : parsed;
}

/** The live GitHub API, read only where the line goes. */
function githubApi(repo) {
  return {
    comments: (n) => gh(`repos/${repo}/issues/${n}/comments?per_page=100`, "GET", undefined, true),
    createComment: (n, body) => gh(`repos/${repo}/issues/${n}/comments`, "POST", { body }),
    updateComment: (id, body) => gh(`repos/${repo}/issues/comments/${id}`, "PATCH", { body }),
    updateIssue: (n, body) => gh(`repos/${repo}/issues/${n}`, "PATCH", { body }),
  };
}

function main() {
  const apply = process.argv.includes("--apply");
  const issues = readIssues(REPO);
  const results = syncProgress(issues, githubApi(REPO), { dryRun: !apply });
  if (!results.length) {
    console.log("No epic has tasks; nothing to update.");
    return;
  }
  for (const { number, line, action } of results) console.log(`#${number}: ${line} (${action})`);
  if (!apply) console.log("\nNothing was changed. Re-run with --apply to write the lines.");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
