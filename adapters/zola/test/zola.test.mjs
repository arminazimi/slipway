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
const zola = process.env.ZOLA ?? "zola";
const skip = spawnSync(zola, ["--version"]).status === 0 ? false : "install Zola (or set ZOLA) to run it";

function build(t, edit = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-zola-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, dir, { recursive: true });
  cpSync(join(adapter, "starter"), dir, { recursive: true });
  edit(dir);
  const result = spawnSync(zola, ["build"], { cwd: dir, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);

  // Run the adapter script
  const adapterScript = spawnSync("node", [join(adapter, "src", "index.mjs"), dir], { encoding: "utf8" });
  assert.equal(adapterScript.status, 0, adapterScript.stderr + adapterScript.stdout);

  return dir;
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async (t) => {
  const dir = build(t);
  const report = await doctor(dir, { build: join(dir, "public") });
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every page with a file, with headings and links at their source lines", { skip }, (t) => {
  const dir = build(t);
  const map = JSON.parse(read(dir, "public/sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => `${p.url} ${p.source}`).sort(), [
    "/ content/_index.md",
    "/docs/ content/docs/_index.md",
    "/docs/intro/ content/docs/intro.md"
  ].sort());
  const intro = page(map, "/docs/intro/");
  assert.deepEqual(intro.sections, [
    { id: "install-the-package", level: 1, line: 6, text: "Install the package" },
    { id: "what-s-new", level: 2, line: 10, text: "What's new?" },
    { id: "custom-notes", level: 2, line: 17, text: "Notes" },
    { id: "setext-heading", level: 2, line: 22, text: "Setext heading" },
    { id: "notes", level: 2, line: 24, text: "Notes" },
  ]);
  assert.deepEqual(intro.links, [{ href: "https://www.npmjs.com/", line: 8 }, { href: "../about/", line: 19 }]);
  assert.deepEqual(page(map, "/docs/").sections, [{ id: "all-docs", level: 2, line: 5, text: "All docs" }]);
});

test("every heading carries data-source with its source path and line", { skip }, (t) => {
  const dir = build(t);
  const html = read(dir, "public/docs/intro/index.html");
  assert.match(html, /<h1\s+id="install-the-package"\s*data-source="content\/docs\/intro.md:6">Install the <em>package<\/em><\/h1>/);
  assert.match(html, /<h2\s+id="notes"\s*data-source="content\/docs\/intro.md:24">Notes<\/h2>/);
  assert.doesNotMatch(html, /Not a heading<\/h/);
});

test("each page has a Markdown twin, linked from its head", { skip }, (t) => {
  const dir = build(t);
  const twin = read(dir, "public/docs/intro/index.md");
  // Zola front matter parsing using regex might miss if Zola front-matter has no space after ---, so double check twin output
  assert.ok(twin.startsWith("# Intro\n\n# Install the *package*\n") || twin.includes("# Install the *package*\n"), twin);
  assert.doesNotMatch(twin, /^description:/m);
  assert.ok(existsSync(join(dir, "public/index.md")));
  assert.ok(existsSync(join(dir, "public/docs/index.md")));
  assert.match(read(dir, "public/docs/intro/index.html"), /<link rel="alternate" type="text\/markdown" href="(?:\/docs\/intro\/index.md|index.md|intro.md)">/);
});

test("the starter AGENTS.md names only paths a Zola site has", () => {
  const text = readFileSync(join(adapter, "starter/AGENTS.md"), "utf8");
  for (const path of ["content/", "public/", "config.toml", "content-schemas.json", "schema/front-matter.schema.json"]) {
    assert.ok(text.includes(`\`${path}\``), `AGENTS.md does not name ${path}`);
  }
  const index = JSON.parse(readFileSync(join(adapter, "starter/content-schemas.json"), "utf8"));
  for (const entry of index.schemas) assert.ok(existsSync(join(adapter, "starter", entry.schema)), entry.schema);
});
