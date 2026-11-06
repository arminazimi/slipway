// Find flaky tests: run every `*.test.mjs` three times, compare the results, and create or update
// one issue labeled `flaky` that lists each test that passed in one run and failed in another.
//
//   node tools/flaky/flaky.mjs        (in flaky.yml; GH_TOKEN and GITHUB_REPOSITORY are set there)
//   node tools/flaky/flaky.mjs --dry  (prints the report instead of touching the issue)
//
// `parseTap` and `findFlaky` are pure: reporter output in, flaky tests out.
import { execFileSync, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const MARKER = "<!-- slipway-flaky -->";
export const TITLE = "Flaky tests";
export const RUNS = 3;

/**
 * Results of one `node --test --test-reporter=tap` run: test name (parents joined with " > ")
 * to { ok, message }. Suites that only wrap subtests are left out; their leaves tell the story.
 */
export function parseTap(text) {
  const results = new Map();
  const stack = []; // [{ indent, name }]
  const deeper = new Map(); // indent -> a deeper result was seen since the last result at this indent
  const lines = String(text).split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const sub = /^(\s*)# Subtest: (.*)$/.exec(line);
    if (sub) {
      while (stack.length && stack.at(-1).indent >= sub[1].length) stack.pop();
      stack.push({ indent: sub[1].length, name: sub[2] });
      continue;
    }
    const result = /^(\s*)(not ok|ok) \d+ - (.*?)(?: # (?:SKIP|TODO).*)?$/.exec(line);
    if (!result || /# (?:SKIP|TODO)/.test(line)) continue;
    const indent = result[1].length;
    const parents = stack.filter((entry) => entry.indent < indent).map((entry) => entry.name);
    // Subtests print before their parent's line, so a parent has children when a deeper result came since its last sibling.
    const hasChildren = deeper.get(indent) === true;
    deeper.set(indent, false);
    for (const key of deeper.keys()) if (key < indent) deeper.set(key, true);
    for (const entry of stack) if (entry.indent < indent && !deeper.has(entry.indent)) deeper.set(entry.indent, true);
    let message = "";
    if (result[2] === "not ok") {
      for (let j = i + 1; j < lines.length && !/^\s*(not ok|ok) \d+/.test(lines[j]); j++) {
        const err = /^\s*error: (.*)$/.exec(lines[j]);
        if (err) { message = err[1].replace(/^['"]|['"]$/g, ""); break; }
      }
    }
    // A parent's `not ok` only says a child failed; keep leaves, and parents with no children.
    const name = [...parents.filter((p, k) => parents.indexOf(p) === k && p !== result[3]), result[3]].join(" > ");
    if (!hasChildren) results.set(name, { ok: result[2] === "ok", message });
  }
  return results;
}

/**
 * @param {Map<string, {ok: boolean, message: string}>[]} runs the parsed runs of one file
 * @returns {{ name: string, passed: number, failed: number, messages: string[] }[]}
 */
export function findFlaky(runs) {
  const names = new Set(runs.flatMap((run) => [...run.keys()]));
  const flaky = [];
  for (const name of [...names].sort()) {
    const seen = runs.map((run) => run.get(name)).filter(Boolean);
    const failed = seen.filter((r) => !r.ok);
    if (failed.length > 0 && failed.length < seen.length) {
      flaky.push({
        name,
        passed: seen.length - failed.length,
        failed: failed.length,
        messages: [...new Set(failed.map((r) => r.message).filter(Boolean))],
      });
    }
  }
  return flaky;
}

/** The issue body for `{ file, flaky }[]`; null when nothing is flaky. */
export function report(entries, runUrl = "") {
  const lines = [];
  for (const { file, flaky } of entries) {
    for (const test of flaky) {
      lines.push(`- \`${file}\`: **${test.name}** failed ${test.failed} of ${test.passed + test.failed} runs`);
      for (const message of test.messages) lines.push(`  - \`${message.replace(/`/g, "'").slice(0, 300)}\``);
    }
  }
  if (lines.length === 0) return null;
  return [MARKER, "", `These tests passed in one run and failed in another (each file ran ${RUNS} times)${runUrl ? `: ${runUrl}` : "."}`, "", ...lines].join("\n");
}

const gh = (...args) => execFileSync("gh", args, { encoding: "utf8" });

function testFiles() {
  return execFileSync("git", ["ls-files", "*.test.mjs"], { encoding: "utf8" }).split("\n").filter(Boolean);
}

function main() {
  const dry = process.argv.includes("--dry");
  const entries = [];
  for (const file of testFiles()) {
    const runs = [];
    for (let n = 0; n < RUNS; n++) {
      const run = spawnSync("node", ["--test", "--test-reporter=tap", file], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
      runs.push(parseTap(run.stdout));
    }
    const flaky = findFlaky(runs);
    if (flaky.length > 0) entries.push({ file, flaky });
  }
  const runUrl = process.env.GITHUB_RUN_ID ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` : "";
  const body = report(entries, runUrl);
  if (dry) return console.log(body ?? "No flaky tests.");

  const existing = JSON.parse(gh("issue", "list", "--label", "flaky", "--state", "open", "--json", "number,body", "--limit", "50"))
    .find((issue) => (issue.body ?? "").includes(MARKER));
  if (!body) {
    if (existing) gh("issue", "close", String(existing.number), "--comment", "No flaky tests in the latest run.");
    return console.log("flaky: none");
  }
  if (existing) gh("issue", "edit", String(existing.number), "--body", body);
  else {
    try { gh("label", "create", "flaky", "--color", "d93f0b", "--description", "A test that passes and fails on the same code"); } catch { /* already there */ }
    gh("issue", "create", "--title", TITLE, "--label", "flaky", "--body", body);
  }
  console.log(`flaky: ${entries.length} file(s) with flaky tests`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
