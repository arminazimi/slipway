// Builds the fixture site with the VitePress adapter and checks what it writes with slipway doctor.
// The build tests need VitePress 1: set VITEPRESS_MODULES to a node_modules folder holding vitepress.
// They skip without it. The other tests run everywhere.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";
import slipway, { sourceOf, sourcePlugin, twinOf, twinUrl, urlOfPage } from "../src/index.mjs";
import { headingsIn, linksIn, titleOf } from "../src/markdown.mjs";

const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const modules = process.env.VITEPRESS_MODULES;
const cli = modules && join(modules, "vitepress/bin/vitepress.js");
const skip = cli && existsSync(cli) ? false : "set VITEPRESS_MODULES to a node_modules folder with VitePress to run it";

let built = null;
/** Copies the fixture and the starter files into a temporary folder and builds it once for every test. */
function build() {
  if (built) return built;
  // realpath: on macOS /var is a symlink, and VitePress compares real paths when it checks links.
  const dir = realpathSync(mkdtempSync(join(tmpdir(), "slipway-vitepress-")));
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, dir, { recursive: true });
  cpSync(join(adapter, "starter"), dir, { recursive: true });
  symlinkSync(modules, join(dir, "node_modules"), "dir");
  const env = { ...process.env, SLIPWAY_VITEPRESS: adapter };
  const result = spawnSync(process.execPath, [cli, "build", dir], { cwd: dir, env, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return (built = dir);
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async () => {
  const dir = build();
  const report = await doctor(dir, { build: join(dir, ".vitepress/dist") });
  // L3 needs the agent-skills index, which this adapter does not write.
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "vitepress");
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every Markdown page, with headings and links at their source lines", { skip }, () => {
  const dir = build();
  const map = JSON.parse(read(dir, ".vitepress/dist/sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => `${p.url} ${p.source}`), [
    "/about.html about.md",
    "/guide/setup.html guide/setup.md",
    "/ index.md",
  ]);
  assert.deepEqual(page(map, "/").sections, [
    { id: "home", level: 1, line: 6, text: "Home" },
    { id: "what-s-new", level: 2, line: 10, text: "What's new?" },
    { id: "notes", level: 2, line: 19, text: "Notes" },
  ]);
  // Images, code blocks, and code spans are not links.
  assert.deepEqual(page(map, "/").links, [{ href: "guide/setup.md", line: 8 }]);
  assert.deepEqual(page(map, "/guide/setup.html").sections, [
    { id: "setup", level: 1, line: 6, text: "Setup" },
    { id: "configure-amp-run", level: 2, line: 10, text: "Configure & run" },
  ]);
  assert.deepEqual(page(map, "/guide/setup.html").links, [{ href: "../index.md", line: 12 }]);
  assert.deepEqual(page(map, "/about.html"), { url: "/about.html", source: "about.md", sections: [], links: [{ href: "guide/setup.md", line: 6 }] });
});

test("every Markdown heading carries data-source with its source path and line", { skip }, () => {
  const dir = build();
  assert.match(read(dir, ".vitepress/dist/index.html"), /<h1[^>]*data-source="index\.md:6"[^>]*>Home/);
  assert.match(read(dir, ".vitepress/dist/index.html"), /<h2[^>]*data-source="index\.md:10"[^>]*>What&#39;s new\?/);
  assert.match(read(dir, ".vitepress/dist/guide/setup.html"), /<h2[^>]*data-source="guide\/setup\.md:10"[^>]*>Configure &amp; run/);
  assert.doesNotMatch(read(dir, ".vitepress/dist/index.html"), /Not a heading<\/h/);
});

test("each page has a Markdown twin, linked from its head", { skip }, () => {
  const dir = build();
  assert.ok(read(dir, ".vitepress/dist/index.md").startsWith("# Home\n\nWelcome."), read(dir, ".vitepress/dist/index.md"));
  assert.ok(read(dir, ".vitepress/dist/about.md").startsWith("# About\n\nRead"), read(dir, ".vitepress/dist/about.md"));
  assert.ok(read(dir, ".vitepress/dist/guide/setup.md").startsWith("# Setup\n\nSetup steps."), read(dir, ".vitepress/dist/guide/setup.md"));
  assert.doesNotMatch(read(dir, ".vitepress/dist/index.md"), /^description:/m);
  assert.match(read(dir, ".vitepress/dist/guide/setup.html"), /<link rel="alternate" type="text\/markdown" href="\/guide\/setup\.md">/);
});

test("a stale heading line is caught by slipway doctor", { skip }, async () => {
  // The map is written at build time, so editing the source afterwards leaves it stale.
  const dir = build();
  const setup = join(dir, "guide/setup.md");
  const before = readFileSync(setup, "utf8");
  writeFileSync(setup, before.replace("## Configure", "\n\n\n## Configure"));
  try {
    const report = await doctor(dir, { build: join(dir, ".vitepress/dist") });
    assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.lines" && f.file === "guide/setup.md"), JSON.stringify(report.findings));
  } finally {
    writeFileSync(setup, before);
  }
});

test("sourceOf uses the original file when VitePress rewrites a page's path", () => {
  const path = join(fixture, "index.md");
  assert.equal(sourceOf({ relativePath: "index.md", path, realPath: path }), "index.md");
  assert.equal(sourceOf({ relativePath: "moved.md", path: join(fixture, "moved.md"), realPath: path }), "index.md");
  assert.equal(sourceOf({ relativePath: "guide/setup.md" }), "guide/setup.md");
  assert.equal(sourceOf({}), null);
});

test("sourcePlugin adds data-source with the line counted from the file's first line", () => {
  const tokens = [{ type: "heading_open", map: [1, 2], attrs: {}, attrSet(key, value) { this.attrs[key] = value; } }];
  let rule;
  sourcePlugin({ core: { ruler: { push: (_name, push) => { rule = push; } } } });
  const path = join(fixture, "index.md");
  rule({ env: { relativePath: "index.md", path, realPath: path }, tokens });
  // The heading is the second line of the body, after four lines of front matter.
  assert.equal(tokens[0].attrs["data-source"], "index.md:6");
});

test("urlOfPage drops index.html and keeps a rewritten page's address", () => {
  assert.equal(urlOfPage("index.md"), "/");
  assert.equal(urlOfPage("guide/index.md"), "/guide/");
  assert.equal(urlOfPage("guide/setup.md"), "/guide/setup.html");
  assert.equal(urlOfPage("guide/setup.md", "install.md"), "/install.html");
});

test("linksIn skips front matter, fences, code spans, and images", () => {
  const raw = '---\nlink: "[x](front)"\n---\n[a](one.md) and [b](two.md "Title")\n~~~\n[c](fenced)\n~~~\n`[d](span)` ![e](img.png) [f](https://x.test/a_(b))\n';
  assert.deepEqual(linksIn(raw), [{ href: "one.md", line: 4 }, { href: "two.md", line: 4 }, { href: "https://x.test/a_(b)", line: 8 }]);
});

test("headingsIn reads level, id, data-source, and the visible text without the permalink anchor", () => {
  const html =
    '<h2 id="what-s-new" tabindex="-1" data-source="index.md:10">What&#39;s <code>new</code>? <a class="header-anchor" href="#what-s-new" aria-label="Permalink">\u200b</a></h2><h3>Plain</h3>';
  assert.deepEqual(headingsIn(html), [
    { level: 2, id: "what-s-new", source: "index.md:10", text: "What's new?" },
    { level: 3, id: undefined, source: undefined, text: "Plain" },
  ]);
});

test("titleOf reads the title in the front matter only", () => {
  assert.equal(titleOf("---\ntitle: Home\ndescription: A\n---\n\n# Other\n"), "Home");
  assert.equal(titleOf('---\ntitle: "A: B" # note\n---\n'), "A: B");
  assert.equal(titleOf("---\ndescription: A\n---\n"), null);
  assert.equal(titleOf("# Other\n"), null);
});

test("twins sit at the page's address with .md, under a title heading unless the page starts with one", () => {
  assert.equal(twinUrl("/"), "/index.md");
  assert.equal(twinUrl("/guide/"), "/guide/index.md");
  assert.equal(twinUrl("/guide/setup.html"), "/guide/setup.md");
  assert.equal(twinOf("---\ntitle: T\n---\n\nBody\n", "T"), "# T\n\nBody\n");
  assert.equal(twinOf("---\ntitle: T\n---\n# Own\n", "T"), "# Own\n");
});

test("the default export is a buildEnd hook", () => {
  assert.equal(typeof slipway, "function");
  assert.equal(slipway.length, 1);
});

test("the starter AGENTS.md names the folders a VitePress site has, and its schemas exist", () => {
  const text = readFileSync(join(adapter, "starter/AGENTS.md"), "utf8");
  for (const path of ["index.md", "guide/", ".vitepress/config.mts", ".vitepress/dist/", "content-schemas.json", "schema/front-matter.schema.json"]) {
    assert.ok(text.includes(`\`${path}\``), `AGENTS.md does not name ${path}`);
  }
  const index = JSON.parse(readFileSync(join(adapter, "starter/content-schemas.json"), "utf8"));
  for (const entry of index.schemas) assert.ok(existsSync(join(adapter, "starter", entry.schema)), entry.schema);
});
