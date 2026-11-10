import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { packagedDeprecations } from "../src/deprecations.ts";
import { doctor } from "../src/doctor.ts";
import { applyFixes } from "../src/fix.ts";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const docsSite = here("../../../fixtures/docs-site");

/** The old `_config.yml` -> engine config entries of ADR 0024, by the old key. */
const configMap = new Map(
  packagedDeprecations()
    .filter((entry) => entry.kind === "config")
    .map((entry) => [entry.old, entry.new]),
);

/**
 * A copy of `fixtures/docs-site` whose `slipway.yml` uses the 0.2 key names, so the deprecated keys are
 * reported at their line.
 */
function legacyCopy(t) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-deprecations-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(docsSite, dir, { recursive: true });
  writeFileSync(
    join(dir, "slipway.yml"),
    ["title: Beacon", "baseurl: /beacon", "direction: rtl", "github: example/beacon", "slipway:", "  source_dir: .", ""].join("\n"),
  );
  return dir;
}

test("the ADR 0024 config map is in the packaged deprecations", () => {
  for (const [old, replacement] of [
    ["baseurl", "base"],
    ["direction", "dir"],
    ["github", "repository.url"],
    ["slipway.source_dir", "repository.dir"],
    ["slipway.languages", "languages"],
    ["slipway.search", "search"],
    ["slipway.logo.light", "theme.options.logo.light"],
    ["slipway.tokens.radius", "theme.options.tokens.radius"],
    ["slipway.analytics.umami.website_id", "theme.options.analytics.umami.website_id"],
  ]) {
    assert.equal(configMap.get(old), replacement, old);
  }
  assert.ok(!configMap.has("theme"), "theme is a live engine key, not a deprecated one");
});

test("a slipway.yml with 0.2 keys in a copy of fixtures/docs-site reports the mapped keys at their line", async (t) => {
  const dir = legacyCopy(t);
  const report = await doctor(dir);
  assert.equal(report.generator, "mizzen");
  assert.deepEqual(
    report.findings
      .filter((finding) => finding.id === "config.deprecated")
      .map(({ file, line, old, new: replacement }) => ({ file, line, old, new: replacement })),
    [
      { file: "slipway.yml", line: 2, old: "baseurl", new: "base" },
      { file: "slipway.yml", line: 3, old: "direction", new: "dir" },
      { file: "slipway.yml", line: 4, old: "github", new: "repository.url" },
      { file: "slipway.yml", line: 6, old: "slipway.source_dir", new: "repository.dir" },
    ],
  );
});

test("an engine site's slipway.yml is not reported as a legacy config", async () => {
  const report = await doctor(docsSite);
  assert.deepEqual(report.findings.filter((finding) => finding.id === "config.deprecated"), []);
});

test("a legacy config reports each setting once, at its deepest mapped key", async (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-deprecations-once-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  writeFileSync(
    join(dir, "slipway.yml"),
    [
      "title: Minimal",
      "slipway:",
      "  persian:",
      "    digits: true",
      "  arabic:",
      "    digits: true",
      "  languages:",
      "    - { code: en, name: English, prefix: \"\" }",
      "  tokens:",
      "    radius: 0.75rem",
      "    font_body: serif",
      "",
    ].join("\n"),
  );
  const report = await doctor(dir);
  const found = report.findings.filter((finding) => finding.id === "config.deprecated").map((entry) => entry.old);
  assert.deepEqual(found.sort(), [
    "slipway.arabic.digits",
    "slipway.languages",
    "slipway.persian.digits",
    "slipway.tokens.font_body",
    "slipway.tokens.radius",
  ]);
});

test("--fix renames a key in the same block and leaves a move to another block", async (t) => {
  const dir = legacyCopy(t);
  const report = await doctor(dir);
  const diffs = applyFixes(report, dir, { dryRun: false });
  assert.ok(diffs.some((diff) => diff.startsWith("--- slipway.yml")), "the config has a diff");

  const config = readFileSync(join(dir, "slipway.yml"), "utf8");
  assert.match(config, /^base: \/beacon$/m);
  assert.match(config, /^dir: rtl$/m);
  assert.doesNotMatch(config, /^baseurl:/m);
  assert.match(config, /^github: example\/beacon$/m, "github -> repository.url moves block, so a person edits it");
  assert.match(config, /^  source_dir: \.$/m, "slipway.source_dir -> repository.dir moves block, so a person edits it");
});
