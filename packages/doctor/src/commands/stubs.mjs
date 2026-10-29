import { resolve, join, dirname } from "node:path";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stubs, siteFiles } from "../checks/jekyll.mjs";

export const usage = `Usage: slipway stubs <source-dir> [options]

Copy or update the stub files a site needs, keeping files the site owns.

Options:
  --check              list what is missing or stale instead of copying
  --json               output result as JSON
  -h, --help           show this help`;

export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "stubs") return { error: command ? `unknown command: ${command}` : "missing command" };
  const options = { source: null, check: false, json: false };
  for (let i = 0; i < rest.length; i++) {
    const arg = rest[i];
    try {
      if (arg === "-h" || arg === "--help") return { help: true };
      else if (arg === "--check") options.check = true;
      else if (arg === "--json") options.json = true;
      else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
      else if (options.source === null) options.source = arg;
      else return { error: `unexpected argument: ${arg}` };
    } catch (error) {
      return { error: error.message };
    }
  }

  if (options.source === null) return { error: "missing <source-dir>" };
  return { options };
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway stubs: ${parsed.error}\n\n${usage}`);
    return 2;
  }

  const { source, check, json } = parsed.options;
  const sourceDir = resolve(source);

  if (!existsSync(sourceDir)) {
    if (json) log(JSON.stringify({ error: `source directory does not exist: ${sourceDir}` }));
    else error(`slipway stubs: source directory does not exist: ${sourceDir}`);
    return 1;
  }

  const __dirname = dirname(fileURLToPath(import.meta.url));
  const pkgRoot = resolve(__dirname, "..", "..", "..", "..");
  const startersDir = join(pkgRoot, "starter-files");

  const missing = [];
  const stale = [];

  for (const stub of stubs) {
    if (siteFiles.includes(stub)) continue;

    const sourcePath = join(startersDir, stub);
    const destPath = join(sourceDir, stub);

    if (!existsSync(destPath)) {
      missing.push(stub);
    } else {
      const sourceContent = readFileSync(sourcePath, "utf8");
      const destContent = readFileSync(destPath, "utf8");
      if (sourceContent !== destContent) {
        stale.push(stub);
      }
    }
  }

  if (check) {
    if (json) {
      log(JSON.stringify({ missing, stale }, null, 2));
    } else {
      if (missing.length === 0 && stale.length === 0) {
        log("all stubs are present and up to date");
      } else {
        if (missing.length > 0) {
          log("missing:");
          for (const stub of missing) log(`  ${stub}`);
        }
        if (stale.length > 0) {
          log("stale:");
          for (const stub of stale) log(`  ${stub}`);
        }
      }
    }
    return missing.length > 0 || stale.length > 0 ? 1 : 0;
  }

  // Not checking, so we apply fixes
  for (const stub of [...missing, ...stale]) {
    const sourcePath = join(startersDir, stub);
    const destPath = join(sourceDir, stub);
    const destDir = dirname(destPath);
    if (!existsSync(destDir)) {
      mkdirSync(destDir, { recursive: true });
    }
    writeFileSync(destPath, readFileSync(sourcePath, "utf8"), "utf8");
  }

  if (json) {
    log(JSON.stringify({ copied: [...missing, ...stale] }, null, 2));
  } else {
    if (missing.length === 0 && stale.length === 0) {
      log("all stubs are present and up to date");
    } else {
      for (const stub of missing) log(`copied ${stub}`);
      for (const stub of stale) log(`updated ${stub}`);
    }
  }

  return 0;
}
