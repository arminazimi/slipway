// Release preparation. Sites pin a tag in `remote_theme: arminazimi/slipway@v0.2.0`, so a release is a version in the
// gemspec, a dated CHANGELOG.md section, and a matching tag. Pull requests add `changelog.d/<issue>.md` fragments instead of
// editing CHANGELOG.md (so parallel PRs never conflict); a release folds them into the dated section and deletes them. This script never pushes or publishes; it prints the commands.
//
//   node tools/release/prepare.mjs 0.2.0           bump the gemspec, date the Unreleased changes and changelog.d/ fragments, print the git commands
//   node tools/release/prepare.mjs --check v0.2.0  fail unless the tag matches the gemspec version (release.yml)
//   node tools/release/prepare.mjs --notes 0.2.0   print the CHANGELOG.md section for a version (release.yml)
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "../theme/tokens.mjs";

const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const versionLine = /^(\s*spec\.version\s*=\s*)"([^"]*)"/m;
const heading = /^## \[([^\]]+)\][^\n]*$/gm;

export function parseVersion(text) {
  const plain = String(text).replace(/^v/, "");
  const match = semver.exec(plain);
  if (!match) throw new Error(`not a version (MAJOR.MINOR.PATCH): ${text}`);
  return { text: plain, parts: match.slice(1).map(Number) };
}

export function compareVersions(a, b) {
  const [x, y] = [parseVersion(a).parts, parseVersion(b).parts];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export function gemspecVersion(gemspec) {
  const match = versionLine.exec(gemspec);
  if (!match) throw new Error("slipway-theme.gemspec has no spec.version line");
  return match[2];
}

export function bumpGemspec(gemspec, version) {
  const current = gemspecVersion(gemspec);
  if (compareVersions(version, current) <= 0) throw new Error(`${version} is not newer than ${current}`);
  return gemspec.replace(versionLine, `$1"${version}"`);
}

/** The lockfiles that record the gem's own version; CI runs bundler in frozen mode, so both must match the gemspec. */
export const lockfiles = ["Gemfile.lock", join("tools", "theme", "gemfiles", "jekyll4.gemfile.lock")];
const ownVersion = /^( {2,4}slipway-theme \()[0-9][^)]*(\))$/gm;

export function bumpLockfile(lockfile, version) {
  const next = lockfile.replace(ownVersion, `$1${version}$2`);
  if (next === lockfile) throw new Error("the lockfile has no slipway-theme version line");
  return next;
}

/** Skills ship with the theme, so each SKILL.md records the theme version in its front matter and a release bumps it. */
const frontMatter = /^---\n([\s\S]*?)\n---\n/;

export function bumpSkillVersion(markdown, version) {
  const front = frontMatter.exec(markdown);
  if (!front) throw new Error("SKILL.md has no front matter");
  const next = front[1].replace(/^( {2}version:\s*)"[^"]*"$/m, `$1"${version}"`);
  if (next === front[1]) throw new Error("SKILL.md front matter has no metadata.version");
  return `---\n${next}\n---\n${markdown.slice(front[0].length)}`;
}

/** Every `## [name]` section of a Keep a Changelog file, with its body. */
export function sections(changelog) {
  const found = [...changelog.matchAll(heading)];
  return found.map((match, i) => {
    const start = match.index + match[0].length;
    let end = i + 1 < found.length ? found[i + 1].index : changelog.length;
    const links = changelog.slice(start, end).search(/^\[[^\]]+\]: /m);
    if (links !== -1) end = start + links;
    return { name: match[1], start: match.index, bodyStart: start, end, body: changelog.slice(start, end).trim() };
  });
}

/** The notes for one version: the body of its section. */
export function releaseNotes(changelog, version) {
  const { text } = parseVersion(version);
  const section = sections(changelog).find((s) => s.name === text);
  if (!section) throw new Error(`CHANGELOG.md has no section for ${text}`);
  if (!section.body) throw new Error(`CHANGELOG.md section ${text} is empty`);
  return section.body;
}

/** The changelog.d/*.md fragments (README.md excepted) in filename order, numbers compared as numbers: 9.md before 10.md. */
export function readFragments(dir = root) {
  const folder = join(dir, "changelog.d");
  if (!existsSync(folder)) return [];
  return readdirSync(folder)
    .filter((f) => f.endsWith(".md") && f !== "README.md")
    .sort((a, b) => a.localeCompare(b, "en", { numeric: true }))
    .map((file) => ({ file, text: readFileSync(join(folder, file), "utf8").trim() }))
    .filter((f) => f.text);
}

/** A fragment is one bullet, possibly with continuation lines; a bare line gets its "- ". */
const bullet = (text) => (/^[-*] /.test(text) ? text : `- ${text}`);

/** Move the Unreleased changes and the fragments under a new dated heading, leave Unreleased empty, and update the compare links. */
export function releaseChangelog(changelog, version, date, previous, fragments = []) {
  const { text } = parseVersion(version);
  const all = sections(changelog);
  if (all.some((s) => s.name === text)) throw new Error(`CHANGELOG.md already has a section for ${text}`);
  const unreleased = all.find((s) => s.name === "Unreleased");
  if (!unreleased) throw new Error("CHANGELOG.md has no Unreleased section");
  const body = [unreleased.body, ...fragments.map((f) => bullet(f.text))].filter(Boolean).join("\n");
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

export function tagMatches(tag, gemspec) {
  return tag === `v${gemspecVersion(gemspec)}`;
}

export function prepare({ version, dir = root, date = new Date().toISOString().slice(0, 10) }) {
  const { text } = parseVersion(version);
  const gemspecFile = join(dir, "slipway-theme.gemspec");
  const changelogFile = join(dir, "CHANGELOG.md");
  const gemspec = readFileSync(gemspecFile, "utf8");
  const previous = gemspecVersion(gemspec);
  const nextGemspec = bumpGemspec(gemspec, text);
  const fragments = readFragments(dir);
  const nextChangelog = releaseChangelog(readFileSync(changelogFile, "utf8"), text, date, previous, fragments);
  writeFileSync(gemspecFile, nextGemspec);
  writeFileSync(changelogFile, nextChangelog);
  for (const name of lockfiles) {
    const file = join(dir, name);
    if (!existsSync(file)) continue;
    writeFileSync(file, bumpLockfile(readFileSync(file, "utf8"), text));
  }
  const skills = join(dir, "skills");
  if (existsSync(skills)) {
    for (const entry of readdirSync(skills, { withFileTypes: true })) {
      const file = join(skills, entry.name, "SKILL.md");
      if (!entry.isDirectory() || !existsSync(file)) continue;
      writeFileSync(file, bumpSkillVersion(readFileSync(file, "utf8"), text));
    }
  }
  for (const { file } of fragments) rmSync(join(dir, "changelog.d", file));
  return [
    `git switch -c release/v${text}`,
    `git commit -am "chore(release): v${text}"`,
    `# open a pull request, merge it once CI is green, then on main:`,
    `git tag -a v${text} -m "v${text}"`,
    `git push origin v${text}`,
  ];
}

export function main(args = process.argv.slice(2), dir = root) {
  const [flag, value] = args;
  if (flag === "--check") {
    const gemspec = readFileSync(join(dir, "slipway-theme.gemspec"), "utf8");
    const version = gemspecVersion(gemspec);
    if (!tagMatches(value, gemspec)) {
      console.error(`FAIL: tag ${value} does not match slipway-theme.gemspec version ${version} (expected v${version})`);
      return 1;
    }
    console.log(`OK: tag ${value} matches slipway-theme.gemspec`);
    return 0;
  }
  if (flag === "--notes") {
    console.log(releaseNotes(readFileSync(join(dir, "CHANGELOG.md"), "utf8"), value));
    return 0;
  }
  if (!flag || flag.startsWith("-")) {
    console.error("usage: node tools/release/prepare.mjs <version> | --check <tag> | --notes <version>");
    return 2;
  }
  const commands = prepare({ version: flag, dir });
  console.log(`Prepared ${parseVersion(flag).text}. Review the diff, then run:\n\n${commands.join("\n")}`);
  return 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exitCode = 1;
  }
}
