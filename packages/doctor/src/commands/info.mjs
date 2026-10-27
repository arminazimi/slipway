import { resolve } from "node:path";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { doctor } from "../doctor.mjs";

export const usage = `Usage: slipway info <source-dir> [options]

Prints the site's mode, theme pin, versions, and spec level.

Options:
  --build <dir>        the built output folder for doctor checks
  --format <format>    text or json (default: text)
  -h, --help           show this help`;

/** Parses arguments. Returns \`{ options }\` or \`{ error }\`. */
export function parseArgs(args) {
  const [command, ...rest] = args;
  if (command === "-h" || command === "--help" || command === "help") return { help: true };
  if (command !== "info") return { error: command ? `unknown command: ${command}` : "missing command" };
  const options = { format: "text", build: null, source: null };
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
      else if (arg.startsWith("-")) return { error: `unknown option: ${arg}` };
      else if (options.source === null) options.source = arg;
      else return { error: `unexpected argument: ${arg}` };
    } catch (error) {
      return { error: error.message };
    }
  }
  if (options.source === null) return { error: "missing <source-dir>" };
  if (!["text", "json"].includes(options.format)) return { error: `--format must be text or json, not ${options.format}` };
  return { options };
}

function getVersions() {
  const versions = { node: process.version };
  try {
    const ruby = spawnSync("ruby", ["-v"], { encoding: "utf8" });
    if (ruby.status === 0) versions.ruby = ruby.stdout.split(" ")[1];
  } catch (e) {}

  try {
    const jekyll = spawnSync("jekyll", ["-v"], { encoding: "utf8" });
    if (jekyll.status === 0) versions.jekyll = jekyll.stdout.trim().split(" ")[1];
  } catch (e) {}

  return versions;
}

function getThemeInfo(sourceDir) {
  let mode = "unknown";
  let themePin = null;
  const configPath = resolve(sourceDir, "_config.yml");
  if (existsSync(configPath)) {
    const content = readFileSync(configPath, "utf8");
    const remoteMatch = content.match(/^remote_theme:\s*(.+)$/m);
    if (remoteMatch) {
      mode = "remote";
      themePin = remoteMatch[1].trim();
    } else if (content.match(/^theme:\s*(.+)$/m)) {
      mode = "gem";
    }
  }
  if (mode === "unknown") {
    if (existsSync(resolve(sourceDir, "slipway-theme.gemspec")) || existsSync(resolve(sourceDir, "_layouts/base.html"))) {
      mode = "template";
    }
  }
  return { mode, themePin };
}

export async function main(args, { log = console.log, error = console.error } = {}) {
  const parsed = parseArgs(args);
  if (parsed.help) {
    log(usage);
    return 0;
  }
  if (parsed.error) {
    error(`slipway info: ${parsed.error}\n\n${usage}`);
    return 2;
  }

  const { source, build, format } = parsed.options;
  const sourceDir = resolve(source);
  if (!existsSync(sourceDir)) {
    error(`slipway info: no such folder: ${source}`);
    return 2;
  }

  const { mode, themePin } = getThemeInfo(sourceDir);
  const versions = getVersions();
  let level = "unknown";
  try {
    const report = await doctor(sourceDir, { build: build ? resolve(build) : null });
    level = report.level || "none";
  } catch (e) {
    // If doctor fails entirely, level remains unknown
  }

  const info = { mode, themePin, versions, level };

  if (format === "json") {
    log(JSON.stringify(info, null, 2));
  } else {
    log(`Mode: ${info.mode}`);
    if (info.themePin) log(`Theme pin: ${info.themePin}`);
    log(`Versions:`);
    for (const [key, val] of Object.entries(info.versions)) {
      log(`  ${key}: ${val}`);
    }
    log(`Doctor level: ${info.level}`);
  }

  return 0;
}
