import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

// Every file and folder allowed at the repository root. A new entry is a
// deliberate decision: keep the list sorted and say why in the same pull
// request instead of letting a scratch file land here.
const allowed = new Set([
  ".gitattributes",
  ".github",
  ".gitignore",
  ".gitleaks.toml",
  ".htmlvalidate.cjs",
  ".ruby-version",
  "AGENTS.md",
  "CHANGELOG.md",
  "CLAUDE.md",
  "CONTRIBUTING.md",
  "Gemfile",
  "Gemfile.lock",
  "LICENSE",
  "README.md",
  "ROADMAP.md",
  "UPGRADING.md",
  "_includes",
  "_layouts",
  "_plugins",
  "action",
  "adapters",
  "assets",
  "brand",
  "changelog.d",
  "docs",
  "examples",
  "package-lock.json",
  "package.json",
  "packages",
  "planning",
  "plugins",
  "schema",
  "site",
  "skills",
  "slipway-theme.gemspec",
  "spec",
  "starter-files",
  "starters",
  "tokens",
  "tools",
]);

const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const rootEntries = [...new Set(tracked.map((path) => path.split("/")[0]))].sort();
const rootFiles = tracked.filter((path) => !path.includes("/"));

test("the repository root holds only allow-listed files and folders", () => {
  const strays = rootEntries.filter((entry) => !allowed.has(entry));
  assert.deepEqual(
    strays,
    [],
    `Stray root ${strays.length === 1 ? "entry" : "entries"}: ${strays.join(", ")}. ` +
      "Delete it, or add it to `allowed` in tools/repo/root.test.mjs when it belongs at the root.",
  );
});

test("no scratch scripts or archives sit at the repository root", () => {
  const offenders = rootFiles.filter(
    (file) => file.startsWith("test_") || file.startsWith("update-") || file.endsWith(".tar.gz"),
  );
  assert.deepEqual(
    offenders,
    [],
    `Scratch ${offenders.length === 1 ? "file" : "files"} at the root: ${offenders.join(", ")}. ` +
      "Delete it or move it under tools/; the root holds only the allow list in tools/repo/root.test.mjs.",
  );
});

test(".gitignore hides the local .tmp-*/ and .tmp/ folders", () => {
  const ignore = readFileSync(join(root, ".gitignore"), "utf8")
    .split(/\r?\n/)
    .map((line) => line.trim());
  for (const pattern of [".tmp-*/", ".tmp/"]) assert.ok(ignore.includes(pattern), `.gitignore ignores ${pattern}`);
});
