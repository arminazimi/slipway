// Gate: new code is TypeScript (AGENTS.md, "TypeScript only").
//
//   node tools/ts-only/run.ts
//
// Fails on any `.tsx` file and on any `.js`, `.mjs`, or `.cjs` file that is not in `legacy.txt`.
// `legacy.txt` lists the JavaScript files that existed when the rule started; it only shrinks.
// Never add a line to it: write the new file as `.ts`. A deleted or converted file may stay listed
// (a missing file is ignored), so a pull request that removes code does not have to edit it.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const root = join(here, "../..");

export function violations(files: string[], legacy: Set<string>): string[] {
  return files.filter((f) => {
    if (f.endsWith(".tsx")) return true;
    if (!/\.(js|mjs|cjs)$/.test(f)) return false;
    return !legacy.has(f);
  });
}

export function readLegacy(path = join(here, "legacy.txt")): Set<string> {
  return new Set(readFileSync(path, "utf8").split("\n").map((l) => l.trim()).filter(Boolean));
}

function repoFiles(): string[] {
  const out = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { cwd: root, encoding: "utf8" });
  return out.split("\n").filter(Boolean);
}

export function main(): number {
  const bad = violations(repoFiles(), readLegacy());
  if (bad.length === 0) {
    console.log("OK ts-only: no new JavaScript or .tsx files");
    return 0;
  }
  console.log("FAIL ts-only: new code must be TypeScript (.ts, Preact with h(), no JSX). See AGENTS.md, \"TypeScript only\".");
  for (const f of bad) console.log(`  ${f}`);
  return 1;
}

if (import.meta.url === `file://${process.argv[1]}`) process.exitCode = main();
