import assert from "node:assert/strict";
import { copyFileSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "../theme/tokens.mjs";
import { bumpGemspec, gemspecVersion, main, prepare, releaseChangelog, releaseNotes, sections, tagMatches } from "./prepare.mjs";

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

/** A temp copy of the real gemspec and CHANGELOG.md. */
function copy() {
  const dir = mkdtempSync(join(tmpdir(), "slipway-release-test-"));
  for (const file of ["slipway-theme.gemspec", "CHANGELOG.md"]) copyFileSync(join(root, file), join(dir, file));
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

test("the real gemspec has a version and the real changelog an Unreleased section", () => {
  assert.match(gemspecVersion(readFileSync(join(root, "slipway-theme.gemspec"), "utf8")), /^\d+\.\d+\.\d+$/);
  assert.ok(sections(readFileSync(join(root, "CHANGELOG.md"), "utf8")).some((s) => s.name === "Unreleased"));
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

test("prepare bumps a temp copy of the gemspec and changelog and prints the git commands", () => {
  const dir = copy();
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
  const dir = copy();
  quiet(() => main(["9.0.0"], dir));
  assert.equal(quiet(() => main(["--check", "v9.0.0"], dir)), 0);
  assert.equal(quiet(() => main(["--check", "v9.0.1"], dir)), 1);
  assert.equal(quiet(() => main(["--check", "9.0.0"], dir)), 1);
  assert.equal(tagMatches("v0.1.0", gemspec), true);
});
