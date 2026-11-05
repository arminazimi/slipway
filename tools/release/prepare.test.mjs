import assert from "node:assert/strict";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { root } from "../theme/tokens.mjs";
import { bumpGemspec, bumpLockfile, bumpSkillVersion, gemspecVersion, lockfiles, main, prepare, readFragments, releaseChangelog, releaseNotes, sections, tagMatches } from "./prepare.mjs";

const gemspec = 'Gem::Specification.new do |spec|\n  spec.name = "slipway-theme"\n  spec.version = "0.1.0"\nend\n';
const changelog = `# Changelog

Intro.

## [Unreleased]

### Added

- New thing.

## [0.1.0] - 2026-10-01

### Added

- First thing.

[Unreleased]: https://github.com/arminazimi/slipway/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/arminazimi/slipway/releases/tag/v0.1.0
`;

/** A temp copy of the gemspec, changelog, and lockfiles, so `prepare` has a whole release tree to work on. */
function copy() {
  const dir = mkdtempSync(join(tmpdir(), "slipway-release-test-"));
  writeFileSync(join(dir, "slipway-theme.gemspec"), gemspec);
  writeFileSync(join(dir, "CHANGELOG.md"), changelog);
  for (const file of lockfiles) {
    const dest = join(dir, file);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(join(root, file), dest);
  }
  return dir;
}

const quiet = (fn) => {
  const [log, error] = [console.log, console.error];
  console.log = console.error = () => {};
  try {
    return fn();
  } finally {
    [console.log, console.error] = [log, error];
  }
};

test("the real gemspec has a version and the lockfiles agree with it", () => {
  const version = gemspecVersion(readFileSync(join(root, "slipway-theme.gemspec"), "utf8"));
  assert.match(version, /^\d+\.\d+\.\d+$/);
  for (const file of lockfiles) {
    const lock = readFileSync(join(root, file), "utf8");
    assert.ok(lock.includes(`slipway-theme (${version})`), `${file} records a different version, and bundler frozen mode fails`);
  }
});

test("bumpLockfile sets the version on both lines and leaves the other gems alone", () => {
  const lock = ["PATH", "  remote: .", "  specs:", "    slipway-theme (0.1.0)", "      jekyll (>= 3.9, < 5.0)", "", "GEM", "  remote: https://rubygems.org/", "  specs:", "    jekyll (4.3.4)", "", "DEPENDENCIES", "  slipway-theme!", "", "  slipway-theme (0.1.0)", ""].join("\n");
  const next = bumpLockfile(lock, "0.2.0");
  assert.deepEqual(next.match(/^ {2,4}slipway-theme \(\d[^)]*\)$/gm), ["    slipway-theme (0.2.0)", "  slipway-theme (0.2.0)"]);
  assert.ok(next.includes("jekyll (4.3.4)"), "another gem changed");
  assert.ok(next.includes("jekyll (>= 3.9, < 5.0)"), "a requirement changed");
  assert.throws(() => bumpLockfile("GEM\n  specs:\n    jekyll (4.3.4)\n", "0.2.0"), /no slipway-theme version line/);
});

test("prepare bumps both lockfiles with the gemspec", () => {
  const dir = withFragments({ "1.md": "A change." });
  prepare({ version: "9.0.0", dir, date: "2026-11-01" });
  for (const file of lockfiles) {
    const lock = readFileSync(join(dir, file), "utf8");
    assert.ok(lock.includes(`slipway-theme (9.0.0)`), file);
    assert.ok(!lock.includes("slipway-theme (0.1.0)"), `${file} still records the old version`);
  }
});

test("bumpGemspec sets a newer version and refuses an older or invalid one", () => {
  assert.equal(gemspecVersion(bumpGemspec(gemspec, "0.2.0")), "0.2.0");
  assert.throws(() => bumpGemspec(gemspec, "0.1.0"), /not newer/);
  assert.throws(() => bumpGemspec(gemspec, "0.0.9"), /not newer/);
  assert.throws(() => bumpGemspec(gemspec, "0.2"), /not a version/);
});

test("releaseChangelog dates the Unreleased changes and leaves Unreleased empty", () => {
  const out = releaseChangelog(changelog, "0.2.0", "2026-11-01", "0.1.0");
  const all = sections(out);
  assert.deepEqual(all.map((s) => s.name), ["Unreleased", "0.2.0", "0.1.0"]);
  assert.equal(all[0].body, "");
  assert.equal(all[1].body, "### Added\n\n- New thing.");
  assert.match(out, /^## \[0\.2\.0\] - 2026-11-01$/m);
  assert.match(out, /^\[Unreleased\]: https:\/\/github\.com\/arminazimi\/slipway\/compare\/v0\.2\.0\.\.\.HEAD$/m);
  assert.match(out, /^\[0\.2\.0\]: https:\/\/github\.com\/arminazimi\/slipway\/compare\/v0\.1\.0\.\.\.v0\.2\.0$/m);
  assert.equal(releaseNotes(out, "v0.1.0"), "### Added\n\n- First thing.");
});

test("releaseChangelog refuses an empty Unreleased section or a version it already has", () => {
  const released = releaseChangelog(changelog, "0.2.0", "2026-11-01", "0.1.0");
  assert.throws(() => releaseChangelog(released, "0.3.0", "2026-11-02", "0.2.0"), /empty/);
  assert.throws(() => releaseChangelog(changelog, "0.1.0", "2026-11-01", "0.1.0"), /already has/);
});

/** A temp dir with changelog.d/ holding the given files. */
function withFragments(files) {
  const dir = copy();
  mkdirSync(join(dir, "changelog.d"));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, "changelog.d", name), text);
  return dir;
}

test("bumpSkillVersion sets metadata.version in the front matter only", () => {
  const markdown = `---\nname: slipway-site\ndescription: Do a thing.\nmetadata:\n  version: "0.1.0"\n---\n\n# Body\n\nversion: "0.1.0"\n`;
  const next = bumpSkillVersion(markdown, "0.2.0");
  assert.match(next, /^metadata:\n {2}version: "0\.2\.0"$/m);
  assert.match(next, /^version: "0\.1\.0"$/m, "a version line in the body changed");
  assert.throws(() => bumpSkillVersion("---\nname: x\n---\n", "0.2.0"), /no metadata.version/);
  assert.throws(() => bumpSkillVersion("# No front matter\n", "0.2.0"), /no front matter/);
});

test("prepare bumps every skill's version with the gemspec", () => {
  const dir = withFragments({ "1.md": "A change." });
  mkdirSync(join(dir, "skills", "slipway-site"), { recursive: true });
  writeFileSync(
    join(dir, "skills", "slipway-site", "SKILL.md"),
    '---\nname: slipway-site\ndescription: Do a thing.\nmetadata:\n  version: "0.1.0"\n---\n',
  );
  prepare({ version: "9.0.0", dir, date: "2026-11-01" });
  assert.match(readFileSync(join(dir, "skills", "slipway-site", "SKILL.md"), "utf8"), /^ {2}version: "9\.0\.0"$/m);
});

test("prepare bumps a temp copy of the gemspec and changelog and prints the git commands", () => {
  const dir = withFragments({ "1.md": "A change." });
  const before = gemspecVersion(readFileSync(join(dir, "slipway-theme.gemspec"), "utf8"));
  const commands = prepare({ version: "9.0.0", dir, date: "2026-11-01" });
  assert.equal(gemspecVersion(readFileSync(join(dir, "slipway-theme.gemspec"), "utf8")), "9.0.0");
  const out = readFileSync(join(dir, "CHANGELOG.md"), "utf8");
  assert.match(out, /^## \[9\.0\.0\] - 2026-11-01$/m);
  assert.ok(releaseNotes(out, "9.0.0").length > 0);
  assert.match(out, before === "0.0.0" ? /^\[9\.0\.0\]: .*\/releases\/tag\/v9\.0\.0$/m : /^\[9\.0\.0\]: .*\/compare\//m);
  assert.ok(commands.includes("git tag -a v9.0.0 -m \"v9.0.0\""));
  assert.ok(commands.every((c) => !/gem push|npm publish/.test(c)));
});

test("--check fails when the tag and the gemspec version differ", () => {
  const dir = withFragments({ "1.md": "A change." });
  quiet(() => main(["9.0.0"], dir));
  assert.equal(quiet(() => main(["--check", "v9.0.0"], dir)), 0);
  assert.equal(quiet(() => main(["--check", "v9.0.1"], dir)), 1);
  assert.equal(quiet(() => main(["--check", "9.0.0"], dir)), 1);
  assert.equal(tagMatches("v0.1.0", gemspec), true);
});

test("readFragments orders by number, ignores README.md, and returns [] without a folder or with an empty one", () => {
  assert.deepEqual(readFragments(copy()), []);
  assert.deepEqual(readFragments(withFragments({})), []);
  const dir = withFragments({ "README.md": "How to.", "10.md": "Ten.", "9.md": "Nine.", "100.md": "Hundred.", "2.md": "  \n" });
  assert.deepEqual(readFragments(dir).map((f) => f.file), ["9.md", "10.md", "100.md"]);
});

test("releaseChangelog adds fragments after the Unreleased lines, one bullet each, keeping a fragment's extra lines", () => {
  const fragments = [{ text: "Plain line (#2)." }, { text: "- Two lines (#3).\n  The second line." }];
  const out = releaseChangelog(changelog, "0.2.0", "2026-11-01", "0.1.0", fragments);
  assert.equal(sections(out)[1].body, "### Added\n\n- New thing.\n- Plain line (#2).\n- Two lines (#3).\n  The second line.");
  assert.equal(sections(out)[0].body, "");
});

test("releaseChangelog releases fragments alone but refuses when both are empty", () => {
  const empty = changelog.replace("### Added\n\n- New thing.\n\n", "");
  assert.equal(sections(releaseChangelog(empty, "0.2.0", "2026-11-01", "0.1.0", [{ text: "Only." }]))[1].body, "- Only.");
  assert.throws(() => releaseChangelog(empty, "0.2.0", "2026-11-01", "0.1.0", []), /nothing to release/);
});

test("prepare folds changelog.d fragments into the dated section and deletes them but keeps README.md", () => {
  const dir = withFragments({ "README.md": "How to.", "5.md": "Five.", "12.md": "Twelve.\nMore." });
  prepare({ version: "9.0.0", dir, date: "2026-11-01" });
  const notes = releaseNotes(readFileSync(join(dir, "CHANGELOG.md"), "utf8"), "9.0.0");
  assert.ok(notes.endsWith("- Five.\n- Twelve.\nMore."));
  assert.deepEqual([existsSync(join(dir, "changelog.d/5.md")), existsSync(join(dir, "changelog.d/12.md")), existsSync(join(dir, "changelog.d/README.md"))], [false, false, true]);
});
