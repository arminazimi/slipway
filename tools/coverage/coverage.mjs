// Line coverage of the Node tests, using Node's built-in coverage (no dependency).
//   node tools/coverage/coverage.mjs          run the tests, print the table, fail below the floor
//   node tools/coverage/coverage.mjs --dry    same, but never fail
// The floor lives in tools/coverage/floor.json and only rises: raise it by hand when the notice says so.
import { execFileSync, spawnSync } from "node:child_process";
import { appendFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const FLOOR_FILE = join(here, "floor.json");
const ROOTS = ["packages/", "tools/", "planning/"];

// Pull the "all files" line percentage out of the spec reporter's coverage table.
export function parseCoverage(output) {
  const row = output.split("\n").map((line) => line.replace(/^ℹ\s*/, "")).find((line) => /^all files\s*\|/.test(line));
  if (!row) return null;
  const percent = Number(row.split("|")[1]);
  return Number.isFinite(percent) ? percent : null;
}

// Returns { ok, message }. Below the floor fails; clearly above it suggests a higher floor.
export function judge(percent, floor) {
  if (percent == null) return { ok: false, message: "coverage: no coverage table found in the test output" };
  if (percent < floor) return { ok: false, message: `coverage: ${percent.toFixed(2)}% is below the floor of ${floor}%` };
  const raised = Math.floor(percent);
  if (raised > floor) return { ok: true, message: `coverage: ${percent.toFixed(2)}%. Notice: raise the floor in tools/coverage/floor.json from ${floor} to ${raised}.` };
  return { ok: true, message: `coverage: ${percent.toFixed(2)}% (floor ${floor}%)` };
}

export function summary(percent, floor, table) {
  return ["## Test coverage", "", `Lines: **${percent == null ? "unknown" : `${percent.toFixed(2)}%`}** (floor ${floor}%)`, "", "```", table.trim(), "```", ""].join("\n");
}

function testFiles() {
  return execFileSync("git", ["ls-files", "*.test.mjs"], { encoding: "utf8" }).split("\n").filter((file) => ROOTS.some((root) => file.startsWith(root)));
}

function main() {
  const dry = process.argv.includes("--dry");
  const floor = JSON.parse(readFileSync(FLOOR_FILE, "utf8")).lines;
  const run = spawnSync("node", ["--test", "--experimental-test-coverage", "--test-reporter=spec", ...testFiles()], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`;
  const percent = parseCoverage(output);
  const lines = output.split("\n").map((line) => line.replace(/^ℹ\s?/, ""));
  const start = lines.findIndex((line) => line.startsWith("start of coverage report"));
  const end = lines.findIndex((line) => line.startsWith("end of coverage report"));
  const table = start >= 0 && end > start ? lines.slice(start + 1, end).join("\n") : "";
  console.log(table);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary(percent, floor, table));
  const verdict = judge(percent, floor);
  console.log(verdict.message);
  if (run.status !== 0) console.log("coverage: some tests failed here; npm run check is the gate for that");
  if (!dry && !verdict.ok) process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
