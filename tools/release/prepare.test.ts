import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import {
  assertNewer,
  assertSameVersion,
  checkTag,
  main,
  parseAnyVersion,
  parseVersion,
  planRelease,
  publishRelease,
  readPackages,
  releaseChangelog,
  releaseNotes,
  tagFor,
  writeRelease,
} from "./prepare.ts";
import { root } from "../root.ts";

// Fixtures live in the OS temp folder, as every check that writes files does.
const work = mkdtempSync(join(tmpdir(), "slipway-release-"));
after(() => rmSync(work, { recursive: true, force: true }));

const changelog = `# Changelog

Intro.

## [Unreleased]

## [0.2.0] - 2026-10-30

### Added

- Old thing.

[Unreleased]: https://github.com/arminazimi/slipway/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/arminazimi/slipway/compare/v0.1.0...v0.2.0
`;

const engineIndex = `/** The engine's version. */
export const version = "0.3.0-dev";
export const name = "mizzen";
`;

const engineManifest = {
  name: "@velella/mizzen",
  version: "0.3.0-dev",
  private: true,
  description: "A deterministic docs engine.",
  license: "Apache-2.0",
  type: "module",
  dependencies: { preact: "^10.0.0" },
};

const themeManifest = {
  name: "@velella/lateen",
  version: "0.3.0-dev",
  private: true,
  description: "A docs theme.",
  license: "MIT",
  type: "module",
  dependencies: { "@velella/mizzen": "0.3.0-dev", shiki: "^4.0.0" },
};

const lockfile = {
  name: "fixture",
  lockfileVersion: 3,
  packages: {
    "": { name: "fixture", workspaces: ["packages/*"] },
    "packages/engine": { name: "@velella/mizzen", version: "0.3.0-dev", license: "Apache-2.0" },
    "packages/theme": { name: "@velella/lateen", version: "0.3.0-dev", dependencies: { "@velella/mizzen": "0.3.0-dev", shiki: "^4.0.0" } },
    "node_modules/preact": { version: "10.0.0" },
  },
};

let created = 0;
type FixtureOptions = { engineVersion?: string; themeVersion?: string; fragments?: Record<string, string> };
/** A release tree: both manifests, the engine's version line, the lockfile, the changelog, and changelog.d fragments. */
function fixture({ engineVersion = "0.3.0-dev", themeVersion = "0.3.0-dev", fragments = { "5.md": "Five.", "12.md": "Twelve.\nMore." } }: FixtureOptions = {}) {
  const dir = join(work, `fixture-${++created}`);
  const write = (path: string, text: string | object) => {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), typeof text === "string" ? text : `${JSON.stringify(text, null, 2)}\n`);
  };
  write("CHANGELOG.md", changelog);
  write("package-lock.json", lockfile);
  write("packages/engine/package.json", { ...engineManifest, version: engineVersion });
  write("packages/engine/src/index.ts", engineIndex.replace("0.3.0-dev", engineVersion));
  write("packages/theme/package.json", { ...themeManifest, version: themeVersion, dependencies: { ...themeManifest.dependencies, "@velella/mizzen": engineVersion } });
  write("changelog.d/README.md", "How to.\n");
  for (const [file, text] of Object.entries(fragments)) write(`changelog.d/${file}`, text);
  return dir;
}

const read = (dir: string, path: string) => readFileSync(join(dir, path), "utf8");

/** Runs `fn` with its output captured, returning what it printed and returned. */
function quiet<T>(fn: () => T): { result: T; output: string } {
  const lines: string[] = [];
  const { log, error } = console;
  try {
    console.log = console.error = (...args: unknown[]) => lines.push(args.join(" "));
    return { result: fn(), output: lines.join("\n") };
  } finally {
    console.log = log;
    console.error = error;
  }
}

test("this repository's packages share one version and the engine exports it", () => {
  const packages = readPackages(root);
  assertSameVersion(packages);
  assert.deepEqual(packages.map((found) => found.name), ["@velella/mizzen", "@velella/lateen"]);
  assert.deepEqual(packages.map((found) => found.dir), ["packages/engine", "packages/theme"]);
  for (const found of packages) assert.deepEqual(found.version, parseAnyVersion(found.version).text);
  assert.match(read(root, "packages/engine/src/index.ts"), new RegExp(`export const version = "${packages[0].version}"`));
  assert.equal(tagFor(packages[0]), `mizzen-v${packages[0].version}`);
  assert.equal(tagFor(packages[1]), `lateen-v${packages[1].version}`);
});

test("a release version is MAJOR.MINOR.PATCH and only a genuine step forward", () => {
  assert.equal(parseVersion("v0.3.0").text, "0.3.0");
  assert.deepEqual(parseVersion("1.2.3").parts, [1, 2, 3]);
  assert.throws(() => parseVersion("0.3"), /not a release version/);
  assert.throws(() => parseVersion("0.3.0-dev"), /not a release version/);
  assert.equal(parseAnyVersion("0.3.0-dev").prerelease, "dev");
  assert.equal(parseAnyVersion("0.3.0").prerelease, null);
  assert.doesNotThrow(() => assertNewer(parseVersion("0.3.0"), parseAnyVersion("0.3.0-dev")));
  assert.doesNotThrow(() => assertNewer(parseVersion("0.4.0"), parseAnyVersion("0.3.0-dev")));
  assert.throws(() => assertNewer(parseVersion("0.3.0"), parseAnyVersion("0.3.0")), /not newer/);
  assert.throws(() => assertNewer(parseVersion("0.2.0"), parseAnyVersion("0.3.0-dev")), /not newer/);
});

test("both packages must already carry the same version", () => {
  const dir = fixture({ themeVersion: "0.2.0" });
  assert.throws(() => planRelease({ version: "0.3.0", dir }), /both packages share one version/);
});

test("a plan names both packages at the release version and folds the fragments into the notes", () => {
  const dir = fixture();
  const release = planRelease({ version: "0.3.0", dir, date: "2026-11-01" });
  assert.equal(release.version, "0.3.0");
  assert.deepEqual(
    release.packages.map((found) => [found.name, found.version, tagFor(found)]),
    [
      ["@velella/mizzen", "0.3.0", "mizzen-v0.3.0"],
      ["@velella/lateen", "0.3.0", "lateen-v0.3.0"],
    ],
  );
  assert.deepEqual(release.fragments.map((fragment) => fragment.file), ["5.md", "12.md"]);
  assert.equal(release.notes, "- Five.\n- Twelve.\nMore.");
  assert.match(release.changelog, /^## \[0\.3\.0\] - 2026-11-01$/m);
  assert.match(release.commands.join("\n"), /git tag -a mizzen-v0\.3\.0 -m "mizzen-v0\.3\.0"/);
  assert.match(release.commands.join("\n"), /git tag -a lateen-v0\.3\.0 -m "lateen-v0\.3\.0"/);
  assert.match(release.commands.join("\n"), /node tools\/release\/prepare\.ts 0\.3\.0 --publish/);
});

test("the dry run is the default: it prints both packages and writes nothing", () => {
  const dir = fixture();
  const before = ["packages/engine/package.json", "packages/theme/package.json", "CHANGELOG.md", "package-lock.json"].map((path) => read(dir, path));
  const { result, output } = quiet(() => main(["0.3.0"], dir));
  assert.equal(result, 0);
  assert.match(output, /mizzen: @velella\/mizzen 0\.3\.0/);
  assert.match(output, /lateen: @velella\/lateen 0\.3\.0/);
  assert.match(output, /dry run: nothing was written, published, or tagged/);
  assert.deepEqual(["packages/engine/package.json", "packages/theme/package.json", "CHANGELOG.md", "package-lock.json"].map((path) => read(dir, path)), before);
  assert.ok(existsSync(join(dir, "changelog.d/5.md")), "a dry run deleted a fragment");
});

test("--write versions both manifests, the engine constant, and the lockfile, and removes private", () => {
  const dir = fixture();
  const { result, output } = quiet(() => main(["0.3.0", "--write"], dir));
  assert.equal(result, 0);
  const engine = JSON.parse(read(dir, "packages/engine/package.json"));
  const theme = JSON.parse(read(dir, "packages/theme/package.json"));
  assert.equal(engine.version, "0.3.0");
  assert.equal(theme.version, "0.3.0");
  assert.equal(engine.private, undefined, "the engine stays private and npm refuses to publish it");
  assert.equal(theme.private, undefined, "the theme stays private and npm refuses to publish it");
  assert.deepEqual(engine.dependencies, { preact: "^10.0.0" });
  assert.deepEqual(theme.dependencies, { "@velella/mizzen": "0.3.0", shiki: "^4.0.0" });
  assert.match(read(dir, "packages/engine/src/index.ts"), /^export const version = "0\.3\.0";$/m);
  assert.match(read(dir, "packages/engine/src/index.ts"), /^export const name = "mizzen";$/m);
  const lock = JSON.parse(read(dir, "package-lock.json"));
  assert.equal(lock.packages["packages/engine"].version, "0.3.0");
  assert.equal(lock.packages["packages/theme"].version, "0.3.0");
  assert.equal(lock.packages["packages/theme"].dependencies["@velella/mizzen"], "0.3.0");
  assert.equal(lock.packages["node_modules/preact"].version, "10.0.0", "an unrelated dependency changed");
  assert.match(output, /git switch -c release\/0\.3\.0/);
  assert.match(output, /git push origin mizzen-v0\.3\.0 lateen-v0\.3\.0/);
});

test("--write dates the changelog, folds the fragments in number order, deletes them, and keeps README.md", () => {
  const dir = fixture();
  quiet(() => main(["0.3.0", "--write"], dir));
  const released = read(dir, "CHANGELOG.md");
  assert.match(released, /^## \[0\.3\.0\] - \d{4}-\d{2}-\d{2}$/m);
  assert.equal(releaseNotes(released, "0.3.0"), "- Five.\n- Twelve.\nMore.");
  assert.match(released, /^\[Unreleased\]: https:\/\/github\.com\/arminazimi\/slipway\/compare\/v0\.3\.0\.\.\.HEAD$/m);
  assert.match(released, /^\[0\.3\.0\]: https:\/\/github\.com\/arminazimi\/slipway\/compare\/v0\.2\.0\.\.\.v0\.3\.0$/m);
  assert.equal(existsSync(join(dir, "changelog.d/5.md")), false);
  assert.equal(existsSync(join(dir, "changelog.d/12.md")), false);
  assert.equal(existsSync(join(dir, "changelog.d/README.md")), true);
});

test("writing refuses a version that is not newer, an empty Unreleased, and a version that already shipped", () => {
  assert.throws(() => planRelease({ version: "0.2.0", dir: fixture() }), /not newer/);
  assert.throws(() => planRelease({ version: "0.3.0", dir: fixture({ fragments: {} }) }), /nothing to release/);
  const shipped = changelog.replace("## [Unreleased]", "## [Unreleased]\n\n## [0.3.0] - 2026-11-01\n\n- Shipped.");
  assert.throws(() => releaseChangelog(shipped, "0.3.0", "2026-11-02", "0.2.0", []), /already has a section/);
});

test("writeRelease returns the files it touched", () => {
  const dir = fixture();
  const release = planRelease({ version: "0.3.0", dir, date: "2026-11-01" });
  assert.deepEqual(writeRelease(release, dir).sort(), [
    "CHANGELOG.md",
    "package-lock.json",
    "packages/engine/package.json",
    "packages/engine/src/index.ts",
    "packages/theme/package.json",
  ]);
});

test("--check matches each tag against the package it names", () => {
  const dir = fixture();
  quiet(() => main(["0.3.0", "--write"], dir));
  const packages = readPackages(dir);
  assert.deepEqual(checkTag("mizzen-v0.3.0", packages), { ok: true, message: "OK: mizzen-v0.3.0 matches @velella/mizzen 0.3.0" });
  assert.deepEqual(checkTag("lateen-v0.3.0", packages), { ok: true, message: "OK: lateen-v0.3.0 matches @velella/lateen 0.3.0" });
  assert.equal(checkTag("lateen-v0.3.1", packages).ok, false);
  assert.throws(() => checkTag("v0.3.0", packages), /not a release tag/);
  assert.throws(() => checkTag("doctor-v0.3.0", packages), /no package is tagged doctor/);
  assert.equal(quiet(() => main(["--check", "lateen-v0.3.1"], dir)).result, 1);
});

test("--publish publishes the engine first, with provenance, and creates each release from its tag", () => {
  const dir = fixture();
  quiet(() => main(["0.3.0", "--write"], dir));
  const calls: Array<{ command: string; args: string[]; notes: string }> = [];
  const run = (found: { command: string; args: string[] }) => {
    const at = found.args.indexOf("--notes-file");
    calls.push({ ...found, notes: at === -1 ? "" : readFileSync(found.args[at + 1], "utf8") });
  };
  const { result } = quiet(() => publishRelease("0.3.0", dir, run));
  assert.equal(result, undefined);
  assert.deepEqual(
    calls.map((call) => `${call.command} ${call.args.slice(0, 5).join(" ")}`),
    [
      "npm publish --workspace @velella/mizzen --provenance --access",
      "gh release create mizzen-v0.3.0 --title mizzen 0.3.0",
      "npm publish --workspace @velella/lateen --provenance --access",
      "gh release create lateen-v0.3.0 --title lateen 0.3.0",
    ],
  );
  assert.deepEqual(calls[0].args, ["publish", "--workspace", "@velella/mizzen", "--provenance", "--access", "public"]);
  assert.deepEqual(calls[1].args.slice(0, 5), ["release", "create", "mizzen-v0.3.0", "--title", "mizzen 0.3.0"]);
  assert.ok(calls[1].args.includes("--verify-tag"));
  assert.match(calls[1].notes, /^@velella\/mizzen 0\.3\.0\n\n- Five\.\n- Twelve\.\nMore\.\n$/);
  assert.match(calls[3].notes, /^@velella\/lateen 0\.3\.0/);
});

test("--publish runs after --write without needing the fragments again", () => {
  const dir = fixture();
  quiet(() => main(["0.3.0", "--write"], dir));
  const calls: string[] = [];
  const { result, output } = quiet(() => main(["0.3.0", "--publish"], dir, (found) => calls.push(`${found.command} ${found.args[0]}`)));
  assert.equal(result, 0);
  assert.deepEqual(calls, ["npm publish", "gh release", "npm publish", "gh release"]);
  assert.match(output, /published @velella\/mizzen, @velella\/lateen 0\.3\.0/);
});

test("--publish refuses to publish a version the manifests do not carry", () => {
  const dir = fixture();
  assert.throws(() => publishRelease("0.3.0", dir, () => {}), /run --write first/);
});

test("--notes prints the changelog section and usage errors exit 2", () => {
  const dir = fixture();
  quiet(() => main(["0.3.0", "--write"], dir));
  const notes = quiet(() => main(["--notes", "0.3.0"], dir));
  assert.equal(notes.result, 0);
  assert.equal(notes.output, "- Five.\n- Twelve.\nMore.");
  assert.equal(quiet(() => main([], dir)).result, 2);
  assert.equal(quiet(() => main(["0.3.0", "--unknown"], dir)).result, 1);
  assert.equal(quiet(() => main(["0.3.0", "--write", "--publish"], dir)).result, 1);
});
