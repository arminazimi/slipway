import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, test } from "node:test";
import { checkLockfiles, findLockfiles, main, root } from "./run.mjs";

// Fixtures live in the OS temp folder, as every check that writes files does.
const work = mkdtempSync(join(tmpdir(), "slipway-lockfile-"));
after(() => rmSync(work, { recursive: true, force: true }));

let created = 0;
/** A temporary tree from { "relative/path": text | object }, for a lock file or several folders. */
function fixture(files) {
  const dir = join(work, `fixture-${++created}`);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), typeof text === "string" ? text : JSON.stringify(text, null, 2));
  }
  return dir;
}

const cleanNpm = {
  name: "fixture",
  lockfileVersion: 3,
  packages: {
    "": { name: "fixture", dependencies: { left: "^1.0.0" } },
    "node_modules/@fixture/local": { resolved: "packages/local", link: true },
    "node_modules/left": { version: "1.0.0", resolved: "https://registry.npmjs.org/left/-/left-1.0.0.tgz" },
    "packages/local": { name: "@fixture/local", version: "0.0.0" },
  },
};

const cleanGemfileLock = `PATH
  remote: .
  specs:
    fixture (0.1.0)

GEM
  remote: https://rubygems.org/
  specs:
    rake (13.0.6)

PLATFORMS
  ruby

DEPENDENCIES
  fixture!
  rake

BUNDLED WITH
   2.4.0
`;

/** Runs main with its output captured, restoring console and the exit code afterwards. */
function run(dir) {
  const lines = [];
  const { log, error } = console;
  const exitCode = process.exitCode;
  try {
    console.log = console.error = (...args) => lines.push(args.join(" "));
    main([dir]);
    return { exitCode: process.exitCode, output: lines.join("\n") };
  } finally {
    console.log = log;
    console.error = error;
    process.exitCode = exitCode;
  }
}

test("clean lock files pass, in the root and in a nested folder", () => {
  const dir = fixture({ "Gemfile.lock": cleanGemfileLock, "package-lock.json": cleanNpm, "app/package-lock.json": cleanNpm });
  const { files, findings } = checkLockfiles(dir);
  assert.deepEqual(findings, []);
  assert.deepEqual(files.map((report) => report.file).sort(), ["Gemfile.lock", "app/package-lock.json", "package-lock.json"]);
  const npm = files.find((report) => report.file === "package-lock.json");
  assert.equal(npm.registry, 1);
  assert.deepEqual(npm.local, ["node_modules/@fixture/local", "packages/local"]);
  assert.equal(files.find((report) => report.file === "Gemfile.lock").local.length, 1);
});

test("a package-lock.json that resolves from git or HTTP fails, naming the file, package, and URL", () => {
  const dir = fixture({
    "package-lock.json": {
      lockfileVersion: 3,
      packages: {
        "": { name: "fixture", dependencies: { left: "git+https://github.com/left/left.git#v1.0.0", right: "^2.0.0" } },
        "node_modules/left": { version: "1.0.0", resolved: "git+https://github.com/left/left.git#0123abc" },
        "node_modules/right": { version: "2.0.0", resolved: "http://example.com/right-2.0.0.tgz" },
      },
    },
  });
  const { findings } = checkLockfiles(dir);
  assert.equal(findings.length, 2, findings.map((f) => f.message).join("\n"));
  const said = findings.map((finding) => finding.message).join("\n");
  assert.match(said, /package-lock\.json/);
  assert.match(said, /node_modules\/left resolves from git\+https:\/\/github\.com\/left\/left\.git#0123abc/);
  assert.match(said, /node_modules\/right resolves from http:\/\/example\.com\/right-2\.0\.0\.tgz/);
});

test("a v1 package-lock.json is checked recursively", () => {
  const dir = fixture({
    "package-lock.json": {
      lockfileVersion: 1,
      dependencies: {
        left: {
          version: "1.0.0",
          resolved: "https://registry.npmjs.org/left/-/left-1.0.0.tgz",
          dependencies: { deep: { version: "0.0.1", resolved: "https://mirror.example.com/deep-0.0.1.tgz" } },
        },
      },
    },
  });
  const { files, findings } = checkLockfiles(dir);
  assert.equal(files[0].registry, 1);
  assert.equal(findings.length, 1);
  assert.match(findings[0].message, /package-lock\.json: left > deep resolves from https:\/\/mirror\.example\.com\/deep-0\.0\.1\.tgz/);
});

test("a Gemfile.lock with an HTTP remote, a GIT section, or a foreign PATH source fails", () => {
  const dir = fixture({
    "Gemfile.lock": `GEM
  remote: http://rubygems.org/
  specs:
    rake (13.0.6)

GIT
  remote: https://github.com/example/private.git
  revision: abc
  specs:
    private (1.0)

PATH
  remote: ../elsewhere
  specs:
    elsewhere (0.1.0)
`,
  });
  const { findings } = checkLockfiles(dir);
  assert.equal(findings.length, 3, findings.map((f) => f.message).join("\n"));
  const said = findings.map((finding) => finding.message).join("\n");
  assert.match(said, /Gemfile\.lock:2: GEM remote http:\/\/rubygems\.org\//);
  assert.match(said, /Gemfile\.lock:7: GIT source https:\/\/github\.com\/example\/private\.git/);
  assert.match(said, /Gemfile\.lock:13: PATH source \.\.\/elsewhere/);
});

test("the check walks folders but not generated trees", () => {
  const dir = fixture({
    "node_modules/x/package-lock.json": cleanNpm,
    "vendor/x/Gemfile.lock": cleanGemfileLock,
    "_site/package-lock.json": cleanNpm,
    ".tmp/package-lock.json": cleanNpm,
    "tools/x/package-lock.json": cleanNpm,
  });
  assert.deepEqual(findLockfiles(dir), ["tools/x/package-lock.json"]);
});

test("main prints FAIL and exits 1, names the file and URL, and prints OK or SKIP otherwise", () => {
  const bad = fixture({ "package-lock.json": { lockfileVersion: 3, packages: { "node_modules/left": { resolved: "git+https://github.com/left/left.git#abc" } } } });
  const failed = run(bad);
  assert.equal(failed.exitCode, 1);
  assert.match(failed.output, /FAIL: lockfile sources/);
  assert.match(failed.output, /package-lock\.json/);
  assert.match(failed.output, /git\+https:\/\/github\.com\/left\/left\.git#abc/);

  const good = run(fixture({ "Gemfile.lock": cleanGemfileLock, "package-lock.json": cleanNpm }));
  assert.equal(good.exitCode, undefined);
  assert.match(good.output, /^check: lockfile sources/m);
  assert.match(good.output, /OK: package-lock\.json \(1 registry URL/);
  assert.match(good.output, /OK: Gemfile\.lock \(1 RubyGems remote/);
  assert.match(good.output, /OK: 2 lock files, every remote source is the official registry over HTTPS/);

  const empty = run(fixture({ "README.md": "# no lock files\n" }));
  assert.equal(empty.exitCode, undefined);
  assert.match(empty.output, /^SKIP: no package-lock\.json or Gemfile\.lock/m);
});

test("every lock file in this repository resolves only from the official registries", () => {
  const { files, findings } = checkLockfiles(root);
  assert.deepEqual(findings, []);
  for (const file of ["Gemfile.lock", "package-lock.json", "adapters/zola/package-lock.json"]) {
    assert.ok(files.some((report) => report.file === file), file);
  }
});
