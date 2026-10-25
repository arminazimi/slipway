import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample, exampleNames } from "./build.mjs";
import { findDeprecations, loadDeprecations } from "./deprecations.mjs";
import { root } from "./tokens.mjs";

const fixtures = join(root, "tools/theme/fixtures/deprecations");
const fixtureList = loadDeprecations(join(fixtures, "deprecations.json"));
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const theme = ["_layouts", "_includes"].flatMap((dir) => readdirSync(join(root, dir)).map((file) => readFileSync(join(root, dir, file), "utf8"))).join("\n");

/** Negative when version a comes before b. */
function compareVersions(a, b) {
  const [x, y] = [a, b].map((v) => v.split(".").map(Number));
  const i = x.findIndex((n, k) => n !== y[k]);
  return i < 0 ? 0 : x[i] - y[i];
}

test("the old fixture gets one warning per kind, with file and line, naming the replacement", () => {
  assert.deepEqual(
    findDeprecations(join(fixtures, "old"), fixtureList).map((d) => d.message),
    [
      "_config.yml:6 slipway.fixture_greeting is deprecated since 0.2.0, use slipway.fixture_welcome",
      "index.md:4 fixture_kicker is deprecated since 0.2.0, use fixture_eyebrow",
    ],
  );
});

test("the new fixture gets no warning", () => {
  assert.deepEqual(findDeprecations(join(fixtures, "new"), fixtureList), []);
});

test("front-matter defaults in _config.yml warn too", () => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-deprecations-"));
  try {
    writeFileSync(join(dir, "_config.yml"), "title: x\ndefaults:\n  - scope: { path: \"\" }\n    values:\n      layout: page\n      fixture_kicker: News\n");
    assert.deepEqual(findDeprecations(dir, fixtureList).map((d) => d.message), ["_config.yml:6 fixture_kicker is deprecated since 0.2.0, use fixture_eyebrow"]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a deprecations file that breaks the schema is refused", () => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-deprecations-"));
  try {
    const path = join(dir, "deprecations.json");
    writeFileSync(path, JSON.stringify({ deprecations: [{ kind: "config", old: "a", new: "b", since: "next" }] }));
    assert.throws(() => loadDeprecations(path), /removed_in|pattern/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("every real deprecation is read through compat.html and kept in the config schema", () => {
  const configSchema = JSON.parse(readFileSync(join(root, "schema/slipway-config.schema.json"), "utf8"));
  const prop = (path) => path.split(".").reduce((node, name) => node?.properties?.[name], configSchema);
  for (const entry of loadDeprecations()) {
    const scope = entry.kind === "config" ? "site" : "page";
    assert.ok(theme.includes(`{% include compat.html new=${scope}.${entry.new} old=${scope}.${entry.old} %}`), `${entry.old} has no compat.html call`);
    assert.ok(compareVersions(entry.since, entry.removed_in) < 0, `${entry.old}: removed_in must come after since`);
    if (entry.kind === "config") {
      assert.ok(prop(entry.new), `${entry.new} is not in the config schema`);
      assert.equal(prop(entry.old)?.deprecated, true, `${entry.old} must stay in the config schema with "deprecated": true`);
    }
  }
});

test("the example sites use no deprecated names", () => {
  for (const name of exampleNames()) assert.deepEqual(findDeprecations(join(root, "examples", name)), [], name);
});

test("a site with the old names builds the same page as with the new ones; the new name wins", { skip }, () => {
  const work = mkdtempSync(join(tmpdir(), "slipway-deprecations-"));
  try {
    const page = (site) => {
      const html = readFileSync(join(buildExample("gem", join(work, `${site}-out`), join(work, site)), "index.html"), "utf8");
      return html.match(/<p class="fixture-welcome">[\s\S]*?<p class="fixture-eyebrow">[^<]*<\/p>/)?.[0];
    };
    for (const site of ["old", "new"]) cpSync(join(fixtures, site), join(work, site), { recursive: true });
    cpSync(join(fixtures, "old"), join(work, "both"), { recursive: true });
    writeFileSync(join(work, "both/_config.yml"), `${readFileSync(join(work, "both/_config.yml"), "utf8")}  fixture_welcome: Welcome back\n`);
    writeFileSync(join(work, "both/index.md"), readFileSync(join(work, "both/index.md"), "utf8").replace("fixture_kicker:", "fixture_eyebrow: Changelog\nfixture_kicker:"));

    const expected = '<p class="fixture-welcome">Welcome aboard</p>\n\n<p class="fixture-eyebrow">Release notes</p>';
    assert.equal(page("new"), expected);
    assert.equal(page("old"), expected);
    assert.equal(page("both"), expected.replace("Welcome aboard", "Welcome back").replace("Release notes", "Changelog"));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
