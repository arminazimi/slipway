// `npm run check`: finds its own work, so a new tool adds no script to package.json and no step to ci.yml.
//
//   node tools/check.mjs           everything: roadmap, tests, the fixed checks, then every tools/*/run.mjs
//   node tools/check.mjs --tools   only the tools/*/run.mjs checks (the browser job in ci.yml)
//   node tools/check.mjs --test    only the tests (`npm test`)
//
// Tests: every `*.test.mjs` in tools/, tools/<name>/, planning/roadmap/, packages/*/test/ and adapters/*/test/. A tool folder
// with a playwright.config.js holds Playwright tests that its run.mjs starts, so node --test skips that folder.
// Tools: every tools/<name>/run.mjs except the generators below. A run.mjs prints SKIP and exits 0 when its optional
// dependency (Playwright, Ruby, Seaworthy) is missing. SLIPWAY_SKIP_TOOLS=screenshots,nojs leaves the named tools out.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { root } from "./theme/tokens.mjs";

/** run.mjs files that write files or are libraries rather than checks (their tests cover them). */
export const notChecks = new Set(["html-validate", "sourcemap", "twins"]);

/** Checks without a run.mjs, in the order they run after the tests. */
export const fixedChecks = ["brand", "tokens", "contrast", "logical", "js", "css", "schemas", "site", "docs"];

const dirs = (path) => (existsSync(path) ? readdirSync(path, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort() : []);
const testsIn = (path) => (existsSync(path) ? readdirSync(path).filter((f) => f.endsWith(".test.mjs")).sort().map((f) => join(path, f)) : []);

export function testFiles(dir = root) {
  const folders = [
    join(dir, "planning/roadmap"),
    join(dir, "tools"),
    ...dirs(join(dir, "tools")).map((n) => join(dir, "tools", n)).filter((p) => !existsSync(join(p, "playwright.config.js"))),
    ...["packages", "adapters"].flatMap((group) => dirs(join(dir, group)).map((n) => join(dir, group, n, "test"))),
  ];
  return folders.flatMap(testsIn).map((f) => relative(dir, f));
}

export function toolChecks(dir = root, skip = (process.env.SLIPWAY_SKIP_TOOLS ?? "").split(",")) {
  return dirs(join(dir, "tools")).filter((n) => !notChecks.has(n) && !skip.includes(n) && existsSync(join(dir, "tools", n, "run.mjs"))).map((n) => `tools/${n}/run.mjs`);
}

function run(label, command, args, dir) {
  console.log(`\n> ${label}`);
  const { status } = spawnSync(command, args, { cwd: dir, stdio: "inherit" });
  return status === 0;
}

export function main(args = process.argv.slice(2), dir = root) {
  const [onlyTools, onlyTests] = [args.includes("--tools"), args.includes("--test")];
  const steps = [];
  if (onlyTests) steps.push(["tests", "node", ["--test", ...testFiles(dir)]]);
  else if (!onlyTools) {
    steps.push(["roadmap", "node", ["planning/roadmap/build.mjs", "--check"]]);
    steps.push(["tests", "node", ["--test", ...testFiles(dir)]]);
    for (const name of fixedChecks) steps.push([`check:${name}`, "npm", ["run", "--silent", `check:${name}`]]);
  }
  if (!onlyTests) for (const file of toolChecks(dir)) steps.push([file, "node", [file]]);
  for (const [label, command, commandArgs] of steps) if (!run(label, command, commandArgs, dir)) return 1;
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = main();
