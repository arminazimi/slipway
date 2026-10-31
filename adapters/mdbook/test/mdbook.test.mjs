// Builds the fixture site with the mdBook adapter and checks what it writes with slipway doctor.
// The build tests need mdBook 0.5 or later on the PATH (or set MDBOOK); they skip without it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";
import { annotate, headingsIn, linksIn, pageUrl, sourcePathOf, twinOf, twinUrl, withoutFrontMatter } from "../src/markdown.mjs";
import { applyMarkers, stripMarkers } from "../src/postprocess.mjs";

const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const starter = join(adapter, "starter");
const mdbook = process.env.MDBOOK ?? "mdbook";
const version = spawnSync(mdbook, ["--version"], { encoding: "utf8" });
const found = `${version.stdout ?? ""}`.match(/mdbook\s+v?(\d+)\.(\d+)/i);
const supported = version.status === 0 && found && (Number(found[1]) > 0 || Number(found[2]) >= 5);
const skip = supported ? false : "install mdBook 0.5 or later (or set MDBOOK) to run it";

let built = null;
/** Copies the starter files and the fixture into a temporary folder, points both commands at this adapter, and builds. */
function build() {
  if (built) return built;
  const dir = mkdtempSync(join(tmpdir(), "slipway-mdbook-"));
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  cpSync(starter, dir, { recursive: true });
  // The fixture's book.toml wins over the starter's, then gets the adapter's absolute paths.
  cpSync(fixture, dir, { recursive: true });
  const config = join(dir, "book.toml");
  writeFileSync(
    config,
    readFileSync(config, "utf8")
      .replace(/^command = .*preprocess\.mjs.*$/m, `command = ${JSON.stringify(`node ${join(adapter, "src/preprocess.mjs")}`)}`)
      .replace(/^command = .*render\.mjs.*$/m, `command = ${JSON.stringify(`node ${join(adapter, "src/render.mjs")}`)}`),
  );
  const result = spawnSync(mdbook, ["build", dir], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  const output = join(dir, "book/html");
  return (built = { dir, out: existsSync(output) ? output : join(dir, "book") });
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async () => {
  const { dir, out } = build();
  const report = await doctor(dir, { build: out });
  // L3 needs the agent-skills index, which this adapter does not write.
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "mdbook");
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every chapter, with headings and links at their source lines", { skip }, () => {
  const { out } = build();
  const map = JSON.parse(read(out, "sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => `${p.url} ${p.source}`), [
    "/index.html src/index.md",
    "/guide/index.html src/guide/index.md",
    "/guide/install.html src/guide/install.md",
  ]);
  // Lines count from the file, so front matter moves them down.
  assert.deepEqual(page(map, "/index.html").sections, [{ id: "welcome", level: 1, line: 6, text: "Welcome" }]);
  assert.deepEqual(page(map, "/index.html").links, [{ href: "guide/index.md", line: 10 }]);
  // A setext heading counts, and its line is the text line.
  assert.deepEqual(page(map, "/guide/index.html").sections, [
    { id: "guide", level: 1, line: 6, text: "Guide" },
    { id: "setext-heading", level: 2, line: 8, text: "Setext heading" },
  ]);
  // Headings and links in fenced code are left out.
  assert.deepEqual(page(map, "/guide/install.html").sections, [
    { id: "install", level: 1, line: 6, text: "Install" },
    { id: "install-the-package", level: 2, line: 8, text: "Install the package" },
    { id: "whats-new", level: 2, line: 17, text: "What’s new?" },
  ]);
  assert.deepEqual(page(map, "/guide/install.html").links, [
    { href: "index.md", line: 19 },
    { href: "https://www.npmjs.com/", line: 19 },
  ]);
});

test("every heading carries data-source with its source path and line", { skip }, () => {
  const { out } = build();
  const html = read(out, "guide/install.html");
  assert.match(html, /<h1 id="install" data-source="src\/guide\/install\.md:6">/);
  assert.match(html, /<h2 id="install-the-package" data-source="src\/guide\/install\.md:8">/);
  assert.match(html, /<h2 id="whats-new" data-source="src\/guide\/install\.md:17">/);
  // The preprocessor's markers do not reach the page.
  assert.doesNotMatch(html, /slipway:/);
});

test("each page has a Markdown twin, linked from its head", { skip }, () => {
  const { out } = build();
  const twin = read(out, "guide/install.md");
  assert.ok(twin.startsWith("# Install\n\n## Install the *package*\n"), twin);
  assert.doesNotMatch(twin, /^---|^title:/m);
  assert.ok(existsSync(join(out, "index.md")));
  assert.ok(existsSync(join(out, "guide/index.md")));
  assert.match(read(out, "guide/install.html"), /<link rel="alternate" type="text\/markdown" href="\/guide\/install.md">/);
});

test("a stale heading line is caught by slipway doctor", { skip }, async () => {
  // The map is written from the source, so editing the source after a build leaves it stale.
  const { dir, out } = build();
  const install = join(dir, "src/guide/install.md");
  writeFileSync(install, "\n\n" + readFileSync(install, "utf8"));
  const report = await doctor(dir, { build: out });
  assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.lines" && f.file === "src/guide/install.md"), JSON.stringify(report.findings));
});

test("the starter AGENTS.md names only paths an mdBook site has", () => {
  const text = readFileSync(join(starter, "AGENTS.md"), "utf8");
  for (const path of ["src/", "src/SUMMARY.md", "book.toml", "book/html/", "content-schemas.json", "schema/book-config.schema.json", "schema/page.schema.json"]) {
    assert.ok(text.includes(`\`${path}\``), `AGENTS.md does not name ${path}`);
  }
  const index = JSON.parse(readFileSync(join(starter, "content-schemas.json"), "utf8"));
  for (const entry of index.schemas) assert.ok(existsSync(join(starter, entry.schema)), entry.schema);
  assert.ok(readFileSync(join(starter, "book.toml"), "utf8").includes("[preprocessor.slipway]"));
});

test("headingsIn reads ATX and setext headings outside fenced code", () => {
  const text = "# One\n\n## Two ##\n\nThree\n-----\n\n```\n# not a heading\n```\n\n#no\n";
  assert.deepEqual(headingsIn(text), [
    { level: 1, text: "One", line: 1 },
    { level: 2, text: "Two", line: 3 },
    { level: 2, text: "Three", line: 5 },
  ]);
});

test("linksIn skips images, code spans, and fenced code", () => {
  const text = "[a](one.md)\n\n`[b](two.md)`\n\n![c](three.png)\n\n```\n[d](four.md)\n```\n";
  assert.deepEqual(linksIn(text), [{ href: "one.md", line: 1 }]);
});

test("front matter is stripped, and its lines are not content", () => {
  const text = '---\ntitle: "See [x](y.md)"\n---\n\n# One\n\n[a](b.md)\n';
  assert.equal(withoutFrontMatter(text), "\n# One\n\n[a](b.md)\n");
  assert.deepEqual(headingsIn(text), [{ level: 1, text: "One", line: 5 }]);
  assert.deepEqual(linksIn(text), [{ href: "b.md", line: 7 }]);
  assert.equal(twinOf(text, "Title"), "# One\n\n[a](b.md)\n");
});

test("annotate leaves a heading that came from an include unmarked", () => {
  const source = "# Own\n\n## Kept\n";
  const content = "# Own\n\n## From include\n\n## Kept\n";
  assert.equal(annotate(content, source), "<!-- slipway:1 -->\n# Own\n\n## From include\n\n<!-- slipway:3 -->\n## Kept\n");
});

test("applyMarkers adds data-source, collects sections, and removes the markers", () => {
  const html =
    '<main>\n<!-- slipway:3 -->\n<h2 id="install"><a class="header" href="#install">Install the <em>package</em></a></h2>\n' +
    '<!-- slipway:12 -->\n<h2 id="whats-new"><a class="header" href="#whats-new">What’s new?</a></h2>\n</main>\n';
  const result = applyMarkers(html, "src/guide/install.md");
  assert.deepEqual(result.sections, [
    { id: "install", level: 2, line: 3, text: "Install the package" },
    { id: "whats-new", level: 2, line: 12, text: "What’s new?" },
  ]);
  assert.match(result.html, /<h2 id="install" data-source="src\/guide\/install\.md:3">/);
  assert.doesNotMatch(result.html, /slipway:/);
  assert.equal(stripMarkers("<!-- slipway:1 -->\n<h1 id=\"x\">X</h1>"), '\n<h1 id="x">X</h1>');
});

test("page and twin addresses follow the chapter's file", () => {
  assert.equal(pageUrl("guide/index.md"), "/guide/index.html");
  assert.equal(twinUrl("/guide/index.html"), "/guide/index.md");
  assert.equal(sourcePathOf("src", "guide/index.md"), "src/guide/index.md");
  assert.equal(sourcePathOf(".", "index.md"), "index.md");
  assert.equal(twinOf("## Body\n", "Title"), "# Title\n\n## Body\n");
  assert.equal(twinOf("# Own\n", "Title"), "# Own\n");
});
