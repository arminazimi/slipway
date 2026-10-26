// Builds the fixture site with the Hugo adapter and checks what it writes with slipway doctor.
// Needs Hugo 0.123 or later on the PATH (or set HUGO); the build tests skip without it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";

const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const hugo = process.env.HUGO ?? "hugo";
const skip = spawnSync(hugo, ["version"]).status === 0 ? false : "install Hugo 0.123 or later (or set HUGO) to run it";

/** Copies the fixture and the starter files into a temporary folder, points the module at this adapter, and builds it. */
function build(t, edit = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-hugo-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, dir, { recursive: true });
  cpSync(join(adapter, "starter"), dir, { recursive: true });
  const config = join(dir, "hugo.toml");
  writeFileSync(config, readFileSync(config, "utf8").replace(/^replacements = .*$/m, `replacements = ${JSON.stringify(`github.com/arminazimi/slipway/adapters/hugo -> ${adapter}`)}`));
  edit(dir);
  const result = spawnSync(hugo, ["--quiet", "--source", dir, "--destination", join(dir, "public")], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return dir;
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async (t) => {
  const dir = build(t);
  const report = await doctor(dir, { build: join(dir, "public") });
  // L3 needs the agent-skills index, which this adapter does not write.
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "hugo");
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every page with a file, with headings and links at their source lines", { skip }, (t) => {
  const dir = build(t);
  const map = JSON.parse(read(dir, "public/sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => `${p.url} ${p.source}`), ["/ content/_index.md", "/docs/ content/docs/_index.md", "/docs/intro/ content/docs/intro.md"]);
  const intro = page(map, "/docs/intro/");
  assert.deepEqual(intro.sections, [
    { id: "install-the-package", level: 1, line: 6, text: "Install the package" },
    { id: "whats-new", level: 2, line: 10, text: "What’s new?" },
    { id: "custom-notes", level: 2, line: 17, text: "Notes" },
    { id: "setext-heading", level: 2, line: 21, text: "Setext heading" },
    { id: "notes", level: 2, line: 24, text: "Notes" },
  ]);
  // Images, code blocks, and code spans are not links.
  assert.deepEqual(intro.links, [{ href: "https://www.npmjs.com/", line: 8 }, { href: "../about/", line: 19 }]);
  assert.deepEqual(page(map, "/docs/").sections, [{ id: "all-docs", level: 2, line: 5, text: "All docs" }]);
});

test("lines count TOML front matter too", { skip }, (t) => {
  const dir = build(t, (dir) => writeFileSync(join(dir, "content/docs/_index.md"), '+++\ntitle = "Docs"\nweight = 1\n+++\n\n## All docs\n'));
  const map = JSON.parse(read(dir, "public/sourcemap.json"));
  assert.deepEqual(page(map, "/docs/").sections, [{ id: "all-docs", level: 2, line: 6, text: "All docs" }]);
});

test("every heading carries data-source with its source path and line", { skip }, (t) => {
  const dir = build(t);
  const html = read(dir, "public/docs/intro/index.html");
  assert.match(html, /<h1 id="install-the-package" data-source="content\/docs\/intro.md:6">Install the <em>package<\/em><\/h1>/);
  assert.match(html, /<h2 id="notes" data-source="content\/docs\/intro.md:24">Notes<\/h2>/);
  assert.doesNotMatch(html, /Not a heading<\/h/);
});

test("each page has a Markdown twin, linked from its head", { skip }, (t) => {
  const dir = build(t);
  const twin = read(dir, "public/docs/intro/index.md");
  assert.ok(twin.startsWith("# Intro\n\n# Install the *package*\n"), twin);
  assert.doesNotMatch(twin, /^description:/m);
  assert.ok(existsSync(join(dir, "public/index.md")));
  assert.ok(existsSync(join(dir, "public/docs/index.md")));
  assert.match(read(dir, "public/docs/intro/index.html"), /<link rel="alternate" type="text\/markdown" href="\/docs\/intro\/index.md">/);
});

test("a stale heading line is caught by slipway doctor", { skip }, async (t) => {
  // The map is written from the source, so editing the source after a build leaves it stale.
  const dir = build(t);
  const intro = join(dir, "content/docs/intro.md");
  writeFileSync(intro, "\n\n" + readFileSync(intro, "utf8").replace(/^---\n/, "").replace(/^/, "---\n"));
  const report = await doctor(dir, { build: join(dir, "public") });
  assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.lines" && f.file === "content/docs/intro.md"), JSON.stringify(report.findings));
});

test("the starter AGENTS.md names only paths a Hugo site has", () => {
  const text = readFileSync(join(adapter, "starter/AGENTS.md"), "utf8");
  for (const path of ["content/", "public/", "hugo.toml", "content-schemas.json", "schema/front-matter.schema.json"]) {
    assert.ok(text.includes(`\`${path}\``), `AGENTS.md does not name ${path}`);
  }
  const index = JSON.parse(readFileSync(join(adapter, "starter/content-schemas.json"), "utf8"));
  for (const entry of index.schemas) assert.ok(existsSync(join(adapter, "starter", entry.schema)), entry.schema);
});
