import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { run } from "../src/checks/doctor.nav-targets.ts";
import { Site } from "../src/site.ts";
import { parseWithLines } from "../src/yaml.ts";

const docsSite = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));

/** An empty temporary folder, removed after the test. */
function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-nav-targets-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** A manifest page entry; the navigation check reads only `url`. */
const page = (url, source = "index.md") => ({
  url,
  source,
  title: source,
  layout: null,
  outputs: [`${source.replace(/\.md$/, "")}/index.html`],
  hashes: { source: "a".repeat(64), html: "b".repeat(64) },
});

/** Writes a build folder with the manifest the check reads. */
function buildWith(t, pages) {
  const build = tempDir(t);
  mkdirSync(join(build, ".slipway"));
  writeFileSync(join(build, ".slipway/manifest.json"), JSON.stringify({ version: 1, pages }));
  return build;
}

/** Every `url` in a navigation object, in file order. */
function navUrls(value, found = []) {
  if (Array.isArray(value)) value.forEach((item) => navUrls(item, found));
  else if (value && typeof value === "object") {
    if (typeof value.url === "string") found.push(value.url);
    Object.values(value).forEach((item) => navUrls(item, found));
  }
  return found;
}

test("doctor.nav-targets reads the navigation of fixtures/docs-site against its manifest", async (t) => {
  const navigation = parseWithLines(readFileSync(join(docsSite, "_data/navigation.yml"), "utf8")).data;
  const urls = navUrls(navigation);
  assert.ok(urls.includes("/dashboard/"), "the fixture has an app page in its navigation");

  // The manifest lists doc pages only: the dashboard is an app page and is proved by the output file instead.
  const build = buildWith(t, urls.filter((url) => url !== "/dashboard/").map((url) => page(url)));
  mkdirSync(join(build, "dashboard"));
  writeFileSync(join(build, "dashboard/index.html"), "<!doctype html>\n");

  const { status, findings } = await run(new Site(docsSite, { build }));
  assert.equal(status, "pass");
  assert.deepEqual(findings, []);
});

test("doctor.nav-targets reports a target missing from the manifest at its navigation line", async (t) => {
  const source = tempDir(t);
  writeFileSync(join(source, "slipway.yml"), "title: Broken\nnavigation: _data/navigation.yml\n");
  mkdirSync(join(source, "_data"));
  writeFileSync(
    join(source, "_data/navigation.yml"),
    "main:\n  - title: Home\n    url: /\n  - title: Broken\n    url: /broken.html\n",
  );
  const build = buildWith(t, [page("/")]);

  const { status, findings } = await run(new Site(source, { build }));
  assert.equal(status, "fail");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, "_data/navigation.yml");
  assert.equal(findings[0].line, 5);
  assert.match(findings[0].message, /\/broken\.html/);
});

test("doctor.nav-targets reads the navigation path from the engine config", async (t) => {
  const source = tempDir(t);
  writeFileSync(join(source, "slipway.yml"), "title: Custom\nnavigation: docs/nav.yml\n");
  mkdirSync(join(source, "docs"));
  writeFileSync(join(source, "docs/nav.yml"), "main:\n  - title: Home\n    url: /\n  - title: Missing\n    url: /missing/\n");
  const build = buildWith(t, [page("/")]);

  const { status, findings } = await run(new Site(source, { build }));
  assert.equal(status, "fail");
  assert.equal(findings.length, 1);
  assert.equal(findings[0].file, "docs/nav.yml");
});

test("doctor.nav-targets reports nothing without a build to check against", async () => {
  const { status, findings } = await run(new Site(docsSite));
  assert.equal(status, "pass");
  assert.deepEqual(findings, []);
});
