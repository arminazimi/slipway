// slipway doctor <dir> [--build <dir>] [--format text|json|sarif] [--level L0|L1|L2|L3] [--network]
// Exit codes: 0 the target level is reached (with no --level: no MUST fails), 1 findings, 2 usage error.
import { relative, resolve, sep } from "node:path";
import { doctor, levels } from "./doctor.mjs";
import { describe, toSarif } from "./report.mjs";
import { applyFixes } from "./fix.mjs";
import * as infoCommand from "./commands/info.mjs";
import * as completionCommand from "./commands/completion.mjs";

export const usage = `Usage: slipway doctor <source-dir> [options]

Checks a site against the agent-editable site spec and prints the level it reaches.

Options:
  --build <dir>        the built output folder; tests on the output fail without it
  --format <format>    text, json, or sarif (default: text)
  --level L0|L1|L2|L3  exit 0 when this level is reached (default: every MUST passes)
  --network            fetch https schemas named in content-schemas.json
  --fix                automatically fix safe cases (e.g., missing stubs, deprecated keys)
  --dry-run            print a diff of what --fix would do, without changing files
  -h, --help           show this help`;

const formats = ["text", "json", "sarif"];

/** Parses arguments. Returns `{ options }` or `{ error }`. */
export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "doctor" && command !== "info" && command !== "completion") return { error: command ? `unknown command: ${command}` : "missing command" };
  const options = { format: "text", network: false, build: null, level: null, source: null, fix: false, dryRun: false };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    const value = () => {
      const next = rest[++i];
      if (next === undefined || next.startsWith("--")) throw new Error(`${arg} needs a value`);
      return next;
    };
    try {
      if (arg === "-h" || arg === "--help") return { help: true };
      else if (arg === "--build") options.build = value();
      else if (arg === "--format") options.format = value();
      else if (arg === "--level") options.level = value();
      else if (arg === "--network") options.network = true;
      else if (arg === "--fix") options.fix = true;
      else if (arg === "--dry-run") options.dryRun = true;
      else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
      else if (options.source === null) options.source = arg;
      else return { error: `unexpected argument: ${arg}` };
    } catch (error) {
      return { error: error.message };
    }
  }
  if (options.source === null) return { error: "missing <source-dir>" };
  if (!formats.includes(options.format)) return { error: `--format must be text, json, or sarif, not ${options.format}` };
  if (options.level !== null && !levels.includes(options.level)) return { error: `--level must be one of ${levels.join(", ")}` };
  return { options };
}

const display = (path) => relative(process.cwd(), path).split(sep).join("/") || ".";

/** A finding as `path:line key: message (allowed: ...) (fix: ...)`, with the path from the current folder. */
export function formatFinding(finding, { source, build }) {
  const base = finding.in === "output" ? build : source;
  const file = finding.file ? `${base ? display(resolve(base, finding.file)) : finding.file}${finding.line ? `:${finding.line}` : ""}` : "";
  return `${file ? `${file} ` : ""}${describe(finding)}`;
}

export function formatText(report, folders) {
  const lines = [`slipway doctor: ${display(folders.source)}${folders.build ? ` (output: ${display(folders.build)})` : ""}`];
  lines.push(`level: ${report.level ?? "none"} (agent-editable ${report.version})`);
  const failed = report.tests.filter((test) => test.status === "fail");
  for (const test of failed) {
    lines.push("", `${test.keyword === "MUST" ? "error" : "warning"} ${test.id} (${test.level ? `${test.level} ${test.keyword}` : test.scope})`);
    for (const finding of test.findings) lines.push(`  ${formatFinding(finding, folders)}`);
  }
  const notRun = report.tests.filter((test) => test.status === "not-run");
  if (notRun.length) {
    lines.push("", "not run:");
    for (const test of notRun) lines.push(`  ${test.id} (${test.level}): ${test.reason}`);
  }
  const passed = report.tests.length - failed.length - notRun.length;
  lines.push("", `${passed} passed, ${failed.length} failed, ${notRun.length} not run`);
  return lines.join("\n");
}

/** The exit code for a report: 0 when the target level is reached, or with no target when no MUST fails. */
export function exitCode(report, target) {
  if (target) return report.level !== null && levels.indexOf(report.level) >= levels.indexOf(target) ? 0 : 1;
  return report.tests.some((test) => test.keyword === "MUST" && test.status === "fail") ? 1 : 0;
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const [command] = args;

  if (command === "info") {
    return infoCommand.main(args, { log, error });
  }
  if (command === "completion") {
    return completionCommand.main(args, { log, error });
  }
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway: ${parsed.error}\n\n${usage}`);
    return 2;
  }
  const { options } = parsed;
  const folders = { source: resolve(options.source), build: options.build ? resolve(options.build) : null };
  let report;
  try {
    report = await doctor(folders.source, { build: folders.build, network: options.network });
  } catch (caught) {
    error(`slipway: ${caught.message}`);
    return 2;
  }

  if (options.fix || options.dryRun) {
    const diffs = applyFixes(report, folders.source, { dryRun: options.dryRun });
    if (diffs.length > 0) {
      log(diffs.join("\n"));
    }
  }

  if (options.format === "json") log(JSON.stringify(report, null, 2));
  else if (options.format === "sarif") log(JSON.stringify(toSarif(report, folders), null, 2));
  else log(formatText(report, folders));
  return exitCode(report, options.level);
}
