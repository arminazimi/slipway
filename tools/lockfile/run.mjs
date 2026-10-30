// Lock file sources: every package a lock file installs must come from the official registry over HTTPS,
// so a compromised or mistyped lock file cannot fetch code from another host (`sec.lockfile` in ROADMAP.md).
//
//   - package-lock.json: every `resolved` is https://registry.npmjs.org/. Entries without one (workspace
//     links, bundled dependencies) install from the repository itself and are listed as local.
//   - Gemfile.lock: every GEM `remote:` is https://rubygems.org/. A GIT section is always a finding; a
//     PATH section is allowed only for this repository's own gem (remote: ., from `gemspec` in Gemfile).
//
//   node tools/lockfile/run.mjs [root]    check every lock file under root (default: this repository)
//
// The walk skips generated trees (node_modules, vendor, _site, dot folders), so it only sees the lock
// files a repository commits. `npm run check` runs this file on its own (tools/check.mjs).
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
export const npmRegistry = "https://registry.npmjs.org/";
export const gemRegistry = "https://rubygems.org/";

const skipped = new Set(["node_modules", "vendor", "_site", "test-results", "__pycache__"]);
const skippedPaths = new Set(["planning/roadmap/out", "spec/docs-site"]);

const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** Every package-lock.json and Gemfile.lock under `dir`, relative to it, without generated trees. */
export function findLockfiles(dir = root, base = dir, found = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const rel = relative(base, path).split(sep).join("/");
    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || skipped.has(entry.name) || skippedPaths.has(rel)) continue;
      findLockfiles(path, base, found);
    } else if (entry.isFile() && (entry.name === "package-lock.json" || entry.name === "Gemfile.lock")) {
      found.push(rel);
    }
  }
  return found.sort();
}

/** True for a tarball address on the npm registry over HTTPS, with no credentials in the URL. */
export function isNpmRegistry(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "registry.npmjs.org" && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** True for https://rubygems.org, with or without the trailing slash. */
export const isGemRegistry = (value) => value.replace(/\/+$/, "") === "https://rubygems.org";

/**
 * The packages of a package-lock.json and the ones that resolve from somewhere else.
 * v2/v3 list them in `packages`; v1 nests them in `dependencies`.
 */
export function checkNpmLock(file, text) {
  const report = { file, kind: "npm", registry: 0, local: [], findings: [] };
  const check = (key, resolved) => {
    if (isNpmRegistry(resolved)) report.registry += 1;
    else
      report.findings.push({
        file,
        key,
        value: resolved,
        message: `${file}: ${key} resolves from ${resolved} (only ${npmRegistry} over HTTPS is allowed)`,
      });
  };
  let lock;
  try {
    lock = JSON.parse(text);
  } catch (error) {
    report.findings.push({ file, message: `${file}: not valid JSON (${error.message})` });
    return report;
  }
  if (lock.packages && typeof lock.packages === "object") {
    for (const [key, entry] of Object.entries(lock.packages)) {
      // "" is the repository itself: its dependencies are version ranges, not downloads.
      if (!key || !entry || typeof entry !== "object") continue;
      if (entry.link === true || !entry.resolved) report.local.push(key);
      else check(key, entry.resolved);
    }
  } else {
    const walk = (dependencies, prefix) => {
      for (const [name, entry] of Object.entries(dependencies ?? {})) {
        if (!entry || typeof entry !== "object") continue;
        const key = prefix ? `${prefix} > ${name}` : name;
        if (entry.resolved) check(key, entry.resolved);
        else report.local.push(key);
        walk(entry.dependencies, key);
      }
    };
    walk(lock.dependencies, "");
  }
  return report;
}

/** The remote sources of a Gemfile.lock: GEM must be RubyGems over HTTPS, GIT never, PATH only ".". */
export function checkGemfileLock(file, text) {
  const report = { file, kind: "gem", registry: 0, local: [], findings: [] };
  let section = "";
  text.split(/\r?\n/).forEach((line, index) => {
    if (/^[A-Z][A-Z ]*$/.test(line)) {
      section = line;
      return;
    }
    const remote = line.match(/^  remote:\s*(\S.*)$/);
    if (!remote || !section) return;
    const value = remote[1].trim();
    const at = `${file}:${index + 1}`;
    const finding = (message) => report.findings.push({ file, value, line: index + 1, message });
    if (section === "GEM") {
      if (isGemRegistry(value)) report.registry += 1;
      else finding(`${at}: GEM remote ${value} (only ${gemRegistry} over HTTPS is allowed)`);
    } else if (section === "GIT") {
      finding(`${at}: GIT source ${value} (a git checkout is not ${gemRegistry})`);
    } else if (section === "PATH") {
      // `gemspec` in Gemfile makes bundler lock this repository's own gem as a path source.
      if (value === ".") report.local.push(`PATH ${value}`);
      else finding(`${at}: PATH source ${value} (only this repository's own gem, remote: ., is allowed)`);
    }
  });
  return report;
}

/** Checks every lock file under `dir`: returns one report per file and every finding across them. */
export function checkLockfiles(dir = root) {
  const files = findLockfiles(dir).map((file) => {
    let text;
    try {
      text = readFileSync(join(dir, file), "utf8");
    } catch (error) {
      const message = `${file}: cannot be read (${error.message})`;
      return { file, kind: file.endsWith("Gemfile.lock") ? "gem" : "npm", registry: 0, local: [], findings: [{ file, message }] };
    }
    return file.endsWith("Gemfile.lock") ? checkGemfileLock(file, text) : checkNpmLock(file, text);
  });
  return { files, findings: files.flatMap((report) => report.findings) };
}

export function main(args = process.argv.slice(2), dir = root) {
  const target = resolve(args.find((arg) => !arg.startsWith("-")) ?? dir);
  console.log(`check: lockfile sources (npm: ${npmRegistry}, RubyGems: ${gemRegistry}, HTTPS only)`);
  const { files, findings } = checkLockfiles(target);
  if (!files.length) {
    console.log(`SKIP: no package-lock.json or Gemfile.lock under ${target}`);
    return;
  }
  if (findings.length) {
    console.error(`FAIL: lockfile sources\n${findings.map((finding) => `  ${finding.message}`).join("\n")}`);
    process.exitCode = 1;
    return;
  }
  for (const report of files) {
    const names = report.local.length <= 4 ? ` (${report.local.join(", ")})` : "";
    const skippedLocal = report.kind === "gem" ? plural(report.local.length, "local source") : plural(report.local.length, "local entry", "local entries");
    const local = report.local.length ? `, ${skippedLocal} skipped${names}` : "";
    const registry = report.kind === "gem" ? plural(report.registry, "RubyGems remote") : plural(report.registry, "registry URL");
    console.log(`OK: ${report.file} (${registry}${local})`);
  }
  console.log(`OK: ${plural(files.length, "lock file")}, every remote source is the official registry over HTTPS`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
