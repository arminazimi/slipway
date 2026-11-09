// Release preparation for Mizzen and Lateen. DRY RUN by default: it prints the plan and changes nothing.
//
//   node tools/release/prepare.ts 0.3.0                  print both packages at 0.3.0, the notes, and the commands
//   node tools/release/prepare.ts 0.3.0 --write          write the versions and the dated changelog, then print the git commands
//   node tools/release/prepare.ts 0.3.0 --publish        after the tags are pushed: npm publish both with provenance, create the GitHub releases
//   node tools/release/prepare.ts --check mizzen-v0.3.0  fail unless the tag matches the package's version (a tag push gate)
//   node tools/release/prepare.ts --notes 0.3.0          print the CHANGELOG.md section, for the GitHub release body
//
// The two packages share one version in 0.3.0 ([ADR 0025](../../docs/adr/0025-mizzen-and-lateen.md)): a release is that version in
// both `package.json` files, the engine's exported version, `package-lock.json`, one dated `CHANGELOG.md` section, and one tag per
// package (`mizzen-vX.Y.Z`, `lateen-vX.Y.Z`), Mizzen first. Pull requests add `changelog.d/<issue>.md` fragments instead of editing
// `CHANGELOG.md`, so parallel pull requests never conflict; a release folds them into the dated section and deletes them.
//
// `--write` also drops `"private": true` from both package manifests, because npm refuses to publish a private package. `--publish`
// needs `npm` (with `id-token: write` in GitHub Actions for provenance) and `gh`; it never tags, commits, or pushes.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { pathToFileURL } from "node:url";
import { root } from "../theme/tokens.ts";

/** The workspaces a release versions, in the order they are published: the engine first ([ADR 0025](../../docs/adr/0025-mizzen-and-lateen.md)). */
export const packageDirs = ["packages/engine", "packages/theme"];

const releaseVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const anyVersion = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z][0-9A-Za-z.-]*))?$/;
const packageName = /^@[^/\s]+\/[^/\s]+$/;
/** The engine's exported version, the one the CLI and the SARIF report print. */
const engineVersionLine = /^(export const version = ")[^"]*(";)$/m;

export type Version = { text: string; parts: [number, number, number]; prerelease: string | null };

export type ReleasePackage = {
  /** The workspace path, relative to the repository root. */
  dir: string;
  /** The npm name, `@velella/mizzen` or `@velella/lateen`. */
  name: string;
  /** The part of the name after the scope; the tag is `${prefix}-v${version}`. */
  prefix: string;
  version: string;
  manifest: any;
  manifestPath: string;
};

export type Fragment = { file: string; text: string };

export type ReleasePlan = {
  version: string;
  date: string;
  packages: ReleasePackage[];
  fragments: Fragment[];
  changelogPath: string;
  /** The `CHANGELOG.md` text after the release. */
  changelog: string;
  /** The section the release publishes, for the GitHub release body. */
  notes: string;
  /** The commands a maintainer runs after `--write`. */
  commands: string[];
};

/** A release version, `MAJOR.MINOR.PATCH`, optionally written with a leading `v`. */
export function parseVersion(text: string): Version {
  const plain = String(text).replace(/^v/, "");
  const match = releaseVersion.exec(plain);
  if (!match) throw new Error(`not a release version (MAJOR.MINOR.PATCH): ${text}`);
  return { text: plain, parts: [Number(match[1]), Number(match[2]), Number(match[3])], prerelease: null };
}

/** Any version a manifest may hold, including the `0.3.0-dev` this repository develops on. */
export function parseAnyVersion(text: string): Version {
  const plain = String(text).replace(/^v/, "");
  const match = anyVersion.exec(plain);
  if (!match) throw new Error(`not a version (MAJOR.MINOR.PATCH): ${text}`);
  return { text: plain, parts: [Number(match[1]), Number(match[2]), Number(match[3])], prerelease: match[4] ?? null };
}

export function compareVersions(a: Version, b: Version): number {
  for (let i = 0; i < 3; i++) if (a.parts[i] !== b.parts[i]) return a.parts[i] - b.parts[i];
  return 0;
}

/** A release must be newer than the version the packages develop on; `0.3.0-dev` to `0.3.0` is the one same-number exception. */
export function assertNewer(next: Version, current: Version): void {
  const order = compareVersions(next, current);
  if (order > 0 || (order === 0 && current.prerelease && !next.prerelease)) return;
  throw new Error(`${next.text} is not newer than ${current.text}`);
}

/** Both package manifests, engine first. */
export function readPackages(dir = root): ReleasePackage[] {
  return packageDirs.map((workspace) => {
    const manifestPath = join(dir, workspace, "package.json");
    if (!existsSync(manifestPath)) throw new Error(`${workspace}/package.json is missing`);
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const name = manifest?.name;
    if (typeof name !== "string" || !packageName.test(name)) {
      throw new Error(`${workspace}/package.json has no scoped package name`);
    }
    if (typeof manifest.version !== "string") throw new Error(`${workspace}/package.json has no version`);
    const prefix = name.slice(name.indexOf("/") + 1);
    if (!/^[a-z][a-z0-9-]*$/.test(prefix)) throw new Error(`${name} is not a package name a tag can be made from`);
    return { dir: workspace, name, prefix, version: manifest.version, manifest, manifestPath };
  });
}

/** One release version for both packages: `0.3.0` never ships as `0.3.0` and `0.3.1`. */
export function assertSameVersion(packages: ReleasePackage[]): void {
  const [first] = packages;
  for (const found of packages) {
    if (found.version !== first.version) {
      throw new Error(`${found.name} is ${found.version} but ${first.name} is ${first.version}: both packages share one version`);
    }
  }
}

/** Every `## [name]` section of a Keep a Changelog file, with its body. */
export function sections(changelog: string): Array<{ name: string; start: number; bodyStart: number; end: number; body: string }> {
  const heading = /^## \[([^\]]+)\][^\n]*$/gm;
  const found = [...changelog.matchAll(heading)];
  return found.map((match, i) => {
    const start = match.index + match[0].length;
    let end = i + 1 < found.length ? found[i + 1].index : changelog.length;
    const links = changelog.slice(start, end).search(/^\[[^\]]+\]: /m);
    if (links !== -1) end = start + links;
    return { name: match[1], start: match.index, bodyStart: start, end, body: changelog.slice(start, end).trim() };
  });
}

/** The newest already-released version in a changelog, for the compare link; `0.0.0` when there is none. */
export function latestRelease(changelog: string): string {
  const released = sections(changelog)
    .map((section) => section.name)
    .filter((name) => releaseVersion.test(name))
    .map((name) => parseVersion(name));
  if (!released.length) return "0.0.0";
  return released.reduce((newest, found) => (compareVersions(found, newest) > 0 ? found : newest)).text;
}

/** The notes for one version: the body of its section. */
export function releaseNotes(changelog: string, version: string): string {
  const { text } = parseVersion(version);
  const section = sections(changelog).find((found) => found.name === text);
  if (!section) throw new Error(`CHANGELOG.md has no section for ${text}`);
  if (!section.body) throw new Error(`CHANGELOG.md section ${text} is empty`);
  return section.body;
}

/** The changelog.d/*.md fragments (README.md excepted) in filename order, numbers compared as numbers: 9.md before 10.md. */
export function readFragments(dir = root): Fragment[] {
  const folder = join(dir, "changelog.d");
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((file) => file.endsWith(".md") && file !== "README.md")
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .map((file) => ({ file, text: readFileSync(join(folder, file), "utf8").trim() }))
    .filter((fragment) => fragment.text);
}

/** A fragment is one bullet, possibly with continuation lines; a bare line gets its "- ". */
const bullet = (text: string) => (/^[-*] /.test(text) ? text : `- ${text}`);

/** Move the Unreleased changes and the fragments under a new dated heading, leave Unreleased empty, and update the compare links. */
export function releaseChangelog(changelog: string, version: string, date: string, previous: string, fragments: Fragment[] = []): string {
  const { text } = parseVersion(version);
  const all = sections(changelog);
  if (all.some((section) => section.name === text)) throw new Error(`CHANGELOG.md already has a section for ${text}`);
  const unreleased = all.find((section) => section.name === "Unreleased");
  if (!unreleased) throw new Error("CHANGELOG.md has no Unreleased section");
  const body = [unreleased.body, ...fragments.map((fragment) => bullet(fragment.text))].filter(Boolean).join("\n");
  if (!body) throw new Error("the Unreleased section is empty and changelog.d/ has no fragments: nothing to release");
  let out =
    changelog.slice(0, unreleased.bodyStart) +
    `\n\n## [${text}] - ${date}\n\n${body}\n\n` +
    changelog.slice(unreleased.end).replace(/^\n+/, "");
  const link = /^\[Unreleased\]: (https:\/\/github\.com\/[^/\s]+\/[^/\s]+)\/\S*$/m.exec(out);
  if (link) {
    const base = link[1];
    const from = previous && previous !== "0.0.0" ? `${base}/compare/v${previous}...v${text}` : `${base}/releases/tag/v${text}`;
    out = out.replace(link[0], `[Unreleased]: ${base}/compare/v${text}...HEAD\n[${text}]: ${from}`);
  }
  return out;
}

/** A package manifest at the release version, publishable: the version, the released dependencies, and no `private`. */
export function bumpManifest(manifest: any, version: string, names: Set<string>): any {
  const next = { ...manifest, version };
  delete next.private;
  if (next.dependencies && typeof next.dependencies === "object") {
    for (const name of Object.keys(next.dependencies)) if (names.has(name)) next.dependencies[name] = version;
  }
  return next;
}

/** The workspace versions and the dependencies between them in package-lock.json. */
export function bumpLockfile(lock: any, version: string, names: Set<string>): any {
  const next = JSON.parse(JSON.stringify(lock));
  for (const entry of Object.values<any>(next.packages ?? {})) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.name === "string" && names.has(entry.name)) entry.version = version;
    if (entry.dependencies && typeof entry.dependencies === "object") {
      for (const name of Object.keys(entry.dependencies)) if (names.has(name)) entry.dependencies[name] = version;
    }
  }
  return next;
}

/** The engine's exported version constant. */
export function bumpEngineVersion(source: string, version: string): string {
  if (!engineVersionLine.test(source)) throw new Error("packages/engine/src/index.ts has no `export const version` line");
  return source.replace(engineVersionLine, `$1${version}$2`);
}

/** The tag a package takes: `mizzen-v0.3.0`, `lateen-v0.3.0` ([ADR 0025](../../docs/adr/0025-mizzen-and-lateen.md)). */
export const tagFor = (found: ReleasePackage, version = found.version) => `${found.prefix}-v${version}`;

/** Everything `--write` would change, computed without touching the disk. */
export function planRelease({ version, dir = root, date = new Date().toISOString().slice(0, 10) }: { version: string; dir?: string; date?: string }): ReleasePlan {
  const next = parseVersion(version);
  const packages = readPackages(dir);
  assertSameVersion(packages);
  assertNewer(next, parseAnyVersion(packages[0].version));
  const fragments = readFragments(dir);
  const changelogPath = join(dir, "CHANGELOG.md");
  const changelog = readFileSync(changelogPath, "utf8");
  const released = releaseChangelog(changelog, next.text, date, latestRelease(changelog), fragments);
  const commands = [
    `git switch -c release/${next.text}`,
    `git commit -am "chore(release): ${next.text}"`,
    `# open a pull request, merge it once CI is green, then on main:`,
    ...packages.map((found) => `git tag -a ${tagFor(found, next.text)} -m "${tagFor(found, next.text)}"`),
    `git push origin ${packages.map((found) => tagFor(found, next.text)).join(" ")}`,
    `node tools/release/prepare.ts ${next.text} --publish`,
  ];
  return {
    version: next.text,
    date,
    packages: packages.map((found) => ({ ...found, version: next.text })),
    fragments,
    changelogPath,
    changelog: released,
    notes: releaseNotes(released, next.text),
    commands,
  };
}

/** Writes the plan: both manifests, the engine's version, package-lock.json, and the dated changelog; deletes the fragments. */
export function writeRelease(release: ReleasePlan, dir = root): string[] {
  const names = new Set(release.packages.map((found) => found.name));
  const written: string[] = [];
  for (const found of release.packages) {
    writeFileSync(found.manifestPath, `${JSON.stringify(bumpManifest(found.manifest, release.version, names), null, 2)}\n`);
    written.push(relative(dir, found.manifestPath).split("\\").join("/"));
  }
  writeFileSync(release.changelogPath, release.changelog);
  written.push(relative(dir, release.changelogPath).split("\\").join("/"));
  const engineIndex = join(dir, "packages/engine/src/index.ts");
  writeFileSync(engineIndex, bumpEngineVersion(readFileSync(engineIndex, "utf8"), release.version));
  written.push("packages/engine/src/index.ts");
  const lockPath = join(dir, "package-lock.json");
  if (existsSync(lockPath)) {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    writeFileSync(lockPath, `${JSON.stringify(bumpLockfile(lock, release.version, names), null, 2)}\n`);
    written.push("package-lock.json");
  }
  for (const fragment of release.fragments) rmSync(join(dir, "changelog.d", fragment.file));
  return written;
}

/** A command to run, with its arguments. */
export type Command = { command: string; args: string[] };
export type Runner = (found: Command) => void;

/** The two commands a package needs: publish it with provenance, then create its GitHub release from the pushed tag. */
export function publishCommands(found: ReleasePackage, notesFile: string): Command[] {
  return [
    { command: "npm", args: ["publish", "--workspace", found.name, "--provenance", "--access", "public"] },
    { command: "gh", args: ["release", "create", tagFor(found), "--title", `${found.prefix} ${found.version}`, "--notes-file", notesFile, "--verify-tag"] },
  ];
}

/**
 * Publishes both packages, engine first. The tags must already be pushed and the manifests must already carry the version
 * (`--write` and its pull request did that), so this only publishes and creates the releases.
 */
export function publishRelease(version: string, dir = root, run?: Runner): void {
  const next = parseVersion(version);
  const packages = readPackages(dir);
  assertSameVersion(packages);
  for (const found of packages) {
    if (found.version !== next.text) throw new Error(`${found.name} is ${found.version}, not ${next.text}: run --write first, commit it, and push the tags`);
  }
  const changelog = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
  const notes = releaseNotes(changelog, next.text);
  const scratch = mkdtempSync(join(tmpdir(), "slipway-release-"));
  const execute =
    run ??
    ((command: Command) => {
      execFileSync(command.command, command.args, { cwd: dir, stdio: "inherit" });
    });
  try {
    for (const found of packages) {
      const notesFile = join(scratch, `${found.prefix}.md`);
      writeFileSync(notesFile, `${found.name} ${next.text}\n\n${notes}\n`);
      for (const command of publishCommands(found, notesFile)) execute(command);
    }
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
}

/** Whether a tag names a package and its version: `mizzen-v0.3.0`, `lateen-v0.3.0`. */
export function checkTag(tag: string, packages: ReleasePackage[]): { ok: boolean; message: string } {
  const match = /^([a-z][a-z0-9-]*)-v(\d+\.\d+\.\d+)$/.exec(String(tag));
  if (!match) throw new Error(`not a release tag (mizzen-vX.Y.Z or lateen-vX.Y.Z): ${tag}`);
  const found = packages.find((candidate) => candidate.prefix === match[1]);
  if (!found) throw new Error(`no package is tagged ${match[1]}: expected ${packages.map((candidate) => `${candidate.prefix}-vX.Y.Z`).join(" or ")}`);
  if (found.version !== match[2]) {
    return { ok: false, message: `tag ${tag} does not match ${found.name} ${found.version} (expected ${tagFor(found)})` };
  }
  return { ok: true, message: `OK: ${tag} matches ${found.name} ${found.version}` };
}

const usage = `usage: node tools/release/prepare.ts <version> [--write | --publish]
       node tools/release/prepare.ts --check <mizzen-vX.Y.Z|lateen-vX.Y.Z>
       node tools/release/prepare.ts --notes <version>`;

/** Prints the plan; nothing is written without `--write` and nothing is published without `--publish`. */
export function printPlan(release: ReleasePlan): void {
  console.log(`release: ${release.version} (${release.date}), both packages`);
  for (const found of release.packages) console.log(`  ${found.prefix}: ${found.name} ${release.version} in ${found.dir} (tag ${tagFor(found)})`);
  const fragments = release.fragments.map((fragment) => fragment.file).join(", ") || "none";
  console.log(`  changelog.d: ${fragments} -> CHANGELOG.md`);
  console.log(`\n${release.notes}\n`);
}

export function main(args = process.argv.slice(2), dir = root, run?: Runner): number {
  const flags = args.filter((arg) => arg.startsWith("-"));
  const values = args.filter((arg) => !arg.startsWith("-"));
  const known = new Set(["--dry-run", "--write", "--publish", "--check", "--notes", "--help", "-h"]);
  const unknown = flags.filter((flag) => !known.has(flag));
  try {
    if (unknown.length) throw new Error(`unknown flag ${unknown[0]}\n${usage}`);
    if (flags.includes("--help") || flags.includes("-h")) {
      console.log(usage);
      return 0;
    }
    if (flags.includes("--check")) {
      if (!values.length) throw new Error(`--check needs a tag\n${usage}`);
      const result = checkTag(values[0], readPackages(dir));
      if (!result.ok) {
        console.error(`FAIL: ${result.message}`);
        return 1;
      }
      console.log(result.message);
      return 0;
    }
    if (flags.includes("--notes")) {
      if (!values.length) throw new Error(`--notes needs a version\n${usage}`);
      console.log(releaseNotes(readFileSync(join(dir, "CHANGELOG.md"), "utf8"), values[0]));
      return 0;
    }
    const [version] = values;
    if (!version || values.length > 1) {
      console.error(usage);
      return 2;
    }
    if (flags.includes("--write") && flags.includes("--publish")) throw new Error("--write and --publish are separate steps: write and commit first, then publish the tags");
    if (flags.includes("--publish")) {
      const packages = readPackages(dir);
      assertSameVersion(packages);
      for (const found of packages) console.log(`  ${found.prefix}: ${found.name} ${found.version} in ${found.dir} (tag ${tagFor(found)})`);
      publishRelease(version, dir, run);
      console.log(`\npublished ${packages.map((found) => found.name).join(", ")} ${parseVersion(version).text}`);
      return 0;
    }
    const release = planRelease({ version, dir });
    printPlan(release);
    if (flags.includes("--write")) {
      const written = writeRelease(release, dir);
      console.log(`wrote ${written.join(", ")} and deleted ${release.fragments.length} changelog fragment(s).\n`);
      console.log(release.commands.join("\n"));
      return 0;
    }
    console.log("dry run: nothing was written, published, or tagged. Pass --write, then --publish after the tags.");
    return 0;
  } catch (error) {
    console.error(`FAIL: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
