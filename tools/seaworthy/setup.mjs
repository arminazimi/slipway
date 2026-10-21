// Fetches Seaworthy from git at the commit in pin.json, builds its CLI into .seaworthy/seaworthy
// (ignored by git), and prints the CLI path. A checkout already built at the pinned commit is reused.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
export const root = resolve(here, "../..");

export function readPin(file = join(here, "pin.json")) {
  const pin = JSON.parse(readFileSync(file, "utf8"));
  if (!/^[0-9a-f]{40}$/.test(pin.commit)) throw new Error(`${file}: "commit" must be a full 40-character SHA, not a branch or tag`);
  if (!/^[\w.-]+\/[\w.-]+$/.test(pin.repository)) throw new Error(`${file}: "repository" must look like owner/name`);
  return pin;
}

export function checkoutDir(base = root) {
  return join(base, ".seaworthy/seaworthy");
}

export function cliPath(base = root) {
  return join(checkoutDir(base), "packages/verify/dist/src/cli.js");
}

function defaultRun(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed:\n${result.stdout}${result.stderr}`);
}

export function ensureSeaworthy({ base = root, pin = readPin(), run = defaultRun } = {}) {
  const dir = checkoutDir(base);
  const stamp = join(dir, ".slipway-pin");
  const cli = cliPath(base);
  if (existsSync(cli) && existsSync(stamp) && readFileSync(stamp, "utf8").trim() === pin.commit) return cli;

  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  run("git", ["init", "-q"], dir);
  run("git", ["fetch", "-q", "--depth", "1", `https://github.com/${pin.repository}.git`, pin.commit], dir);
  run("git", ["checkout", "-q", "FETCH_HEAD"], dir);
  run("npm", ["ci", "--silent", "--ignore-scripts", "--no-audit", "--no-fund"], dir);
  run("npx", ["tsc", "-b", "packages/verify"], dir);
  if (!existsSync(cli)) throw new Error(`the Seaworthy build did not produce ${cli}`);
  writeFileSync(stamp, `${pin.commit}\n`);
  return cli;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) console.log(ensureSeaworthy());
