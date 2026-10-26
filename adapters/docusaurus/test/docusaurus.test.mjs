// Builds the fixture site with the Docusaurus adapter and checks what it writes with slipway doctor.
// The build tests need Docusaurus 3: set DOCUSAURUS_MODULES to a node_modules folder holding
// @docusaurus/core, @docusaurus/preset-classic, react, and react-dom. They skip without it; CI installs them.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";
import { contentPages, twinOf, twinUrl } from "../src/index.mjs";
import { headingsIn, lineOffset, linksIn } from "../src/markdown.mjs";

const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const modules = process.env.DOCUSAURUS_MODULES;
const cli = modules && join(modules, "@docusaurus/core/bin/docusaurus.mjs");
const skip = cli && existsSync(cli) ? false : "set DOCUSAURUS_MODULES to a node_modules folder with Docusaurus 3 to run it";

let built = null;
/** Copies the fixture and the starter files into a temporary folder and builds it once for every test. */
function build() {
  if (built) return built;
  const dir = mkdtempSync(join(tmpdir(), "slipway-docusaurus-"));
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, dir, { recursive: true });
  cpSync(join(adapter, "starter"), dir, { recursive: true });
  symlinkSync(modules, join(dir, "node_modules"), "dir");
  // No persistent cache: it lives in the shared node_modules and would hide a change to the adapter.
  const env = { ...process.env, SLIPWAY_DOCUSAURUS: adapter, DOCUSAURUS_NO_PERSISTENT_CACHE: "1" };
  const result = spawnSync(process.execPath, [cli, "build", dir], { cwd: dir, env, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return (built = dir);
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async () => {
  const dir = build();
  const report = await doctor(dir, { build: join(dir, "build") });
  // L3 needs the agent-skills index, which this adapter does not write.
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "docusaurus");
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every Markdown page, with headings and links at their source lines", { skip }, () => {
  const dir = build();
  const map = JSON.parse(read(dir, "build/sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => `${p.url} ${p.source}`), [
    "/ src/pages/index.md",
    "/about/ src/pages/about.md",
    "/blog/2026/10/25/hello/ blog/2026-10-25-hello.md",
    "/docs/guide/setup/ docs/guide/setup.mdx",
    "/docs/intro/ docs/intro.md",
  ]);
  const intro = page(map, "/docs/intro/");
  // The doc's h1 has no id in Docusaurus, so it is not a section; it still carries data-source.
  assert.deepEqual(intro.sections, [
    { id: "whats-new", level: 2, line: 11, text: "What's new?" },
    { id: "custom-notes", level: 2, line: 18, text: "Notes" },
    { id: "setext-heading", level: 2, line: 22, text: "Setext heading" },
    { id: "notes", level: 2, line: 25, text: "Notes" },
  ]);
  // Images, code blocks, and code spans are not links.
  assert.deepEqual(intro.links, [{ href: "https://www.npmjs.com/", line: 9 }, { href: "./guide/setup.mdx", line: 20 }]);
  assert.deepEqual(page(map, "/docs/guide/setup/").sections, [{ id: "configure--run", level: 2, line: 7, text: "Configure & run" }]);
  assert.deepEqual(page(map, "/blog/2026/10/25/hello/").sections, [{ id: "why-a-blog", level: 2, line: 9, text: "Why a blog" }]);
});

test("every Markdown heading carries data-source with its source path and line", { skip }, () => {
  const dir = build();
  const html = read(dir, "build/docs/intro/index.html");
  assert.match(html, /<h1 data-source="docs\/intro.md:7">/);
  assert.match(html, /<h2 data-source="docs\/intro.md:25"[^>]* id="notes">/);
  assert.doesNotMatch(html, /Not a heading<\/h/);
  assert.match(read(dir, "build/about/index.html"), /<h2 data-source="src\/pages\/about.md:8"[^>]* id="contact">/);
});

test("each page has a Markdown twin, linked from its head", { skip }, () => {
  const dir = build();
  const twin = read(dir, "build/docs/intro/index.md");
  assert.ok(twin.startsWith("# Install the *package*\n\nGet it from"), twin);
  assert.doesNotMatch(twin, /^description:/m);
  assert.ok(read(dir, "build/docs/guide/setup/index.md").startsWith("# Setup\n\nSetup steps"));
  assert.ok(existsSync(join(dir, "build/index.md")));
  assert.match(read(dir, "build/docs/intro/index.html"), /<link rel="alternate" type="text\/markdown" href="\/docs\/intro\/index.md">/);
});

test("a stale heading line is caught by slipway doctor", { skip }, async () => {
  // The map is written at build time, so editing the source afterwards leaves it stale.
  const dir = build();
  const intro = join(dir, "docs/intro.md");
  const before = readFileSync(intro, "utf8");
  writeFileSync(intro, before.replace("\n# Install", "\n\n\n# Install"));
  try {
    const report = await doctor(dir, { build: join(dir, "build") });
    assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.lines" && f.file === "docs/intro.md"), JSON.stringify(report.findings));
  } finally {
    writeFileSync(intro, before);
  }
});

test("lineOffset is 0 when remark gets the front matter, and its line count when it does not", () => {
  const raw = "---\ntitle: A\nid: a\n---\n\n## B\n";
  assert.equal(lineOffset(raw, raw), 0);
  assert.equal(lineOffset(raw, "\n## B\n"), 4);
  assert.equal(lineOffset("## B\n", "## B\n"), 0);
});

test("linksIn skips front matter, fences, code spans, and images", () => {
  const raw = '---\nlink: "[x](front)"\n---\n[a](one.md) and [b](two.md "Title")\n~~~\n[c](fenced)\n~~~\n`[d](span)` ![e](img.png) [f](https://x.test/a_(b))\n';
  assert.deepEqual(linksIn(raw), [{ href: "one.md", line: 4 }, { href: "two.md", line: 4 }, { href: "https://x.test/a_(b)", line: 8 }]);
});

test("headingsIn reads level, id, data-source, and the visible text", () => {
  const html = '<h2 data-source="docs/a.md:3" class="anchor" id="whats-new">What&#x27;s <code>new</code>?<a href="#whats-new" class="hash-link" aria-label="Direct link">​</a></h2><h3>Plain</h3>';
  assert.deepEqual(headingsIn(html), [
    { level: 2, id: "whats-new", source: "docs/a.md:3", text: "What's new?" },
    { level: 3, id: undefined, source: undefined, text: "Plain" },
  ]);
});

test("contentPages finds Markdown pages in any plugin's content, without the base URL", () => {
  const plugins = [
    { content: { loadedVersions: [{ docs: [{ permalink: "/base/docs/a", source: "@site/docs/a.md", title: "A" }] }] } },
    { content: [{ type: "jsx", permalink: "/base/", source: "@site/src/pages/index.js" }, { type: "mdx", permalink: "/base/about", source: "@site/src/pages/about.mdx" }] },
    { content: { blogPosts: [{ metadata: { permalink: "/base/blog/hi", source: "@site/blog/hi.md", title: "Hi" } }], tags: { x: { permalink: "/base/blog/tags/x" } } } },
  ];
  assert.deepEqual(contentPages(plugins, { siteDir: "/site", baseUrl: "/base/" }), [
    { path: "/about", source: "src/pages/about.mdx", title: undefined },
    { path: "/blog/hi", source: "blog/hi.md", title: "Hi" },
    { path: "/docs/a", source: "docs/a.md", title: "A" },
  ]);
});

test("twins sit at the page's address with .md, under a title heading unless the page starts with one", () => {
  assert.equal(twinUrl("/docs/intro/"), "/docs/intro/index.md");
  assert.equal(twinUrl("/docs/intro.html"), "/docs/intro.md");
  assert.equal(twinOf("---\ntitle: T\n---\n\nBody\n", "T"), "# T\n\nBody\n");
  assert.equal(twinOf("---\ntitle: T\n---\n# Own\n", "T"), "# Own\n");
});

test("the starter AGENTS.md names the folders a Docusaurus site has, and its schemas exist", () => {
  const text = readFileSync(join(adapter, "starter/AGENTS.md"), "utf8");
  for (const path of ["docs/", "blog/", "src/pages/", "build/", "docusaurus.config.js", "content-schemas.json", "schema/doc.schema.json"]) {
    assert.ok(text.includes(`\`${path}\``), `AGENTS.md does not name ${path}`);
  }
  const index = JSON.parse(readFileSync(join(adapter, "starter/content-schemas.json"), "utf8"));
  for (const entry of index.schemas) assert.ok(existsSync(join(adapter, "starter", entry.schema)), entry.schema);
});
