// Builds the fixture site with the Hexo adapter and checks what it writes with slipway doctor.
// The build tests need Hexo: set HEXO_MODULES to a node_modules folder holding hexo, hexo-renderer-ejs,
// and hexo-renderer-marked. They skip without it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";
import slipway from "../src/index.js";

const { headingsIn, linksIn, sourceHeadings, splitFrontMatter, twinOf, twinUrl, urlOf } = slipway;
const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const modules = process.env.HEXO_MODULES;
const cli = modules && join(modules, "hexo/bin/hexo");
const ready = Boolean(cli && existsSync(cli) && existsSync(join(modules, "hexo-renderer-ejs")) && existsSync(join(modules, "hexo-renderer-marked")));
const skip = ready ? false : "set HEXO_MODULES to a node_modules folder with Hexo 8, hexo-renderer-ejs, and hexo-renderer-marked to run it";

let built = null;
/** Copies the fixture, the starter files, and the plugin into a temporary folder and builds it once for every test. */
function build() {
  if (built) return built;
  const dir = mkdtempSync(join(tmpdir(), "slipway-hexo-"));
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, dir, { recursive: true });
  cpSync(join(adapter, "starter"), dir, { recursive: true });
  symlinkSync(modules, join(dir, "node_modules"), "dir");
  // Hexo loads every file in scripts/ with its instance in scope: the documented way to install the plugin.
  mkdirSync(join(dir, "scripts"));
  cpSync(join(adapter, "src/index.js"), join(dir, "scripts/slipway.js"));
  const result = spawnSync(process.execPath, [cli, "generate"], { cwd: dir, env: process.env, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return (built = dir);
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async () => {
  const dir = build();
  const report = await doctor(dir, { build: join(dir, "public") });
  // L3 needs the agent-skills index, which this adapter does not write.
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "hexo");
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every Markdown page, with headings and links at their source lines", { skip }, () => {
  const dir = build();
  const map = JSON.parse(read(dir, "public/sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => `${p.url} ${p.source}`), [
    "/2026/01/02/hello/ source/_posts/hello.md",
    "/about/ source/about/index.md",
  ]);
  assert.deepEqual(page(map, "/2026/01/02/hello/").sections, [{ id: "First-section", level: 2, line: 8, text: "First section" }]);
  assert.deepEqual(page(map, "/2026/01/02/hello/").links, [{ href: "https://example.com", line: 6 }]);
  assert.deepEqual(page(map, "/about/").sections, [{ id: "Contact", level: 2, line: 7, text: "Contact" }]);
  assert.deepEqual(page(map, "/about/").links, []);
});

test("every Markdown heading carries data-source with its source path and line", { skip }, () => {
  const dir = build();
  const html = read(dir, "public/2026/01/02/hello/index.html");
  assert.match(html, /<h2 [^>]*data-source="source\/_posts\/hello\.md:8"[^>]* id="First-section"|<h2 [^>]*id="First-section"[^>]*data-source="source\/_posts\/hello\.md:8"/);
  assert.match(read(dir, "public/about/index.html"), /data-source="source\/about\/index\.md:7"/);
});

test("each page has a Markdown twin, linked from its head", { skip }, () => {
  const dir = build();
  assert.equal(read(dir, "public/2026/01/02/hello/index.md"), "# Hello\n\nIntro text with a [link](https://example.com).\n\n## First section\n\nBody.\n");
  const twin = read(dir, "public/about/index.md");
  assert.ok(twin.startsWith("# About\n\nAbout this site."), twin);
  assert.doesNotMatch(twin, /^title:/m);
  assert.match(read(dir, "public/about/index.html"), /<link rel="alternate" type="text\/markdown" href="\/about\/index.md">/);
});

test("a stale heading line is caught by slipway doctor", { skip }, async () => {
  // The map is written at build time, so editing the source afterwards leaves it stale.
  const dir = build();
  const post = join(dir, "source/_posts/hello.md");
  const before = readFileSync(post, "utf8");
  writeFileSync(post, before.replace("\n## First section", "\n\n\n## First section"));
  try {
    const report = await doctor(dir, { build: join(dir, "public") });
    assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.lines" && f.file === "source/_posts/hello.md"), JSON.stringify(report.findings));
  } finally {
    writeFileSync(post, before);
  }
});

test("sourceHeadings counts lines from the top of the file, front matter included, and skips code", () => {
  const raw = "---\ntitle: A\n---\n\n# One\n\n```\n## not a heading\n```\n\n## Two ##\n\nSetext\n------\n\n> ### Quoted\n";
  assert.deepEqual(sourceHeadings(raw), [
    { level: 1, line: 5, text: "One" },
    { level: 2, line: 11, text: "Two" },
    { level: 2, line: 13, text: "Setext" },
    { level: 3, line: 16, text: "Quoted" },
  ]);
});

test("splitFrontMatter returns the body and the lines before it", () => {
  assert.deepEqual(splitFrontMatter("---\ntitle: A\n---\n\nBody\n"), { body: "\nBody\n", offset: 3 });
  assert.deepEqual(splitFrontMatter("# No front matter\n"), { body: "# No front matter\n", offset: 0 });
});

test("linksIn skips front matter, fences, code spans, and images", () => {
  const raw = '---\nlink: "[x](front)"\n---\n[a](one.md) and [b](two.md "Title")\n~~~\n[c](fenced)\n~~~\n`[d](span)` ![e](img.png) [f](https://x.test/a_(b))\n';
  assert.deepEqual(linksIn(raw), [{ href: "one.md", line: 4 }, { href: "two.md", line: 4 }, { href: "https://x.test/a_(b)", line: 8 }]);
});

test("headingsIn reads level, id, data-source, and the visible text", () => {
  const html = '<h2 data-source="source/a.md:3" class="anchor" id="whats-new">What&#x27;s <code>new</code>?</h2><h3>Plain</h3>';
  assert.deepEqual(headingsIn(html), [
    { level: 2, id: "whats-new", source: "source/a.md:3", text: "What's new?" },
    { level: 3, id: undefined, source: undefined, text: "Plain" },
  ]);
});

test("twins sit at the page's address with .md, under a title heading unless the page starts with one", () => {
  assert.equal(twinUrl("/about/"), "/about/index.md");
  assert.equal(twinUrl("/about.html"), "/about.md");
  assert.equal(twinOf("---\ntitle: T\n---\n\nBody\n", "T"), "# T\n\nBody\n");
  assert.equal(twinOf("---\ntitle: T\n---\n# Own\n", "T"), "# Own\n");
});

test("urlOf drops a trailing index.html and keeps the address form the generator writes", () => {
  assert.equal(urlOf("about/index.html"), "/about/");
  assert.equal(urlOf("index.html"), "/");
  assert.equal(urlOf("2026/01/02/hello/"), "/2026/01/02/hello/");
  assert.equal(urlOf("about.html"), "/about.html");
});

test("the starter AGENTS.md names the folders a Hexo site has, and its schemas exist", () => {
  const text = readFileSync(join(adapter, "starter/AGENTS.md"), "utf8");
  for (const path of ["source/", "source/_posts/", "themes/", "public/", "_config.yml", "content-schemas.json", "schema/front-matter.schema.json"]) {
    assert.ok(text.includes(`\`${path}\``), `AGENTS.md does not name ${path}`);
  }
  const index = JSON.parse(readFileSync(join(adapter, "starter/content-schemas.json"), "utf8"));
  for (const entry of index.schemas) assert.ok(existsSync(join(adapter, "starter", entry.schema)), entry.schema);
});
