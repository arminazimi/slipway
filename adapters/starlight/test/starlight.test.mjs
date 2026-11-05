// Builds the fixture site with the Starlight adapter and checks what it writes with slipway doctor.
// The build tests need Astro 7 with Starlight: set STARLIGHT_MODULES to a node_modules folder
// holding astro, @astrojs/starlight, and @astrojs/markdown-satteri. They skip without it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";
import { twinOf, twinUrl, urlOf } from "../src/index.mjs";
import { headingsIn, headingLines, linksIn } from "../src/markdown.mjs";

const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const modules = process.env.STARLIGHT_MODULES;
const cli = modules && join(modules, "astro/bin/astro.mjs");
const [major, minor, patch] = process.versions.node.split(".").map(Number);
const nodeNewEnough = major > 22 || (major === 22 && (minor > 23 || (minor === 23 && patch >= 4)));
const skip = !nodeNewEnough
  ? `Astro 7 needs Node.js 22.23.4 or later; this is ${process.versions.node}`
  : cli && existsSync(cli) && existsSync(join(modules, "@astrojs/starlight"))
    ? false
    : "set STARLIGHT_MODULES to a node_modules folder with Astro 7 and Starlight to run it";

let built = null;
/**
 * Copies the fixture and the starter files into a temporary folder and builds it once for every test.
 * Astro 7 needs a real path for the project root: on macOS `mkdtemp` returns `/tmp`, which is a
 * symlink to `/private/tmp`, and the build then resolves module paths against the wrong root.
 */
function build() {
  if (built) return built;
  const dir = mkdtempSync(join(tmpdir(), "slipway-starlight-"));
  const root = realpathSync(dir);
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, root, { recursive: true });
  cpSync(join(adapter, "starter"), root, { recursive: true });
  symlinkSync(modules, join(root, "node_modules"), "dir");
  const env = { ...process.env, SLIPWAY_STARLIGHT: adapter };
  // --force clears the content layer cache. It lives in node_modules beside the fixture, so a
  // previous run could otherwise reuse rendered Markdown built with an older copy of the adapter.
  const result = spawnSync(process.execPath, [cli, "build", "--root", root, "--force"], { cwd: root, env, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return (built = dir);
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async () => {
  const dir = build();
  const report = await doctor(dir, { build: join(dir, "dist") });
  // L3 needs the agent-skills index, which this adapter does not write.
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "starlight");
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every docs page, with headings and links at their source lines", { skip }, () => {
  const dir = build();
  const map = JSON.parse(read(dir, "dist/sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => `${p.url} ${p.source}`), [
    "/guides/ src/content/docs/guides/index.md",
    "/guides/intro/ src/content/docs/guides/intro.md",
    "/guides/setup/ src/content/docs/guides/setup.mdx",
    "/ src/content/docs/index.md",
  ]);
  assert.deepEqual(page(map, "/").sections, [{ id: "what-is-this", level: 2, line: 8, text: "What is this?" }]);
  assert.deepEqual(page(map, "/").links, [{ href: "/guides/intro/", line: 6 }]);
  const intro = page(map, "/guides/intro/");
  // The page title is layout, not a heading line, so it is not a section; the headings are.
  assert.deepEqual(intro.sections, [
    { id: "install-the-package", level: 1, line: 8, text: "Install the package" },
    { id: "whats-new", level: 2, line: 12, text: "What’s new?" },
    { id: "notes", level: 2, line: 19, text: "Notes" },
    { id: "setext-heading", level: 2, line: 23, text: "Setext heading" },
    { id: "notes-1", level: 2, line: 26, text: "Notes" },
  ]);
  // Images, code blocks, and code spans are not links.
  assert.deepEqual(intro.links, [{ href: "https://www.npmjs.com/", line: 10 }, { href: "/", line: 21 }]);
  assert.deepEqual(page(map, "/guides/setup/").sections, [{ id: "configure--run", level: 2, line: 7, text: "Configure & run" }]);
});

test("every Markdown heading carries data-source with its source path and line", { skip }, () => {
  const dir = build();
  const html = read(dir, "dist/guides/intro/index.html");
  assert.match(html, /<h1 data-source="src\/content\/docs\/guides\/intro\.md:8" id="install-the-package">/);
  assert.match(html, /<h2 data-source="src\/content\/docs\/guides\/intro\.md:26" id="notes-1">/);
  assert.doesNotMatch(html, /Not a heading<\/h/);
  assert.match(read(dir, "dist/guides/setup/index.html"), /<h2 data-source="src\/content\/docs\/guides\/setup\.mdx:7" id="configure--run">/);
});

test("each page has a Markdown twin, linked from its head", { skip }, () => {
  const dir = build();
  const twin = read(dir, "dist/guides/intro/index.md");
  assert.ok(twin.startsWith("# Install the *package*\n"), twin);
  assert.doesNotMatch(twin, /^description:/m);
  assert.ok(read(dir, "dist/guides/setup/index.md").startsWith("# Setup\n\nSetup steps"), twin);
  assert.ok(existsSync(join(dir, "dist/index.md")));
  assert.match(read(dir, "dist/guides/intro/index.html"), /<link rel="alternate" type="text\/markdown" href="\/guides\/intro\/index.md">/);
});

test("a stale heading line is caught by slipway doctor", { skip }, async () => {
  // The map is written at build time, so editing the source afterwards leaves it stale.
  const dir = build();
  const intro = join(dir, "src/content/docs/guides/intro.md");
  const before = readFileSync(intro, "utf8");
  writeFileSync(intro, before.replace("\n# Install", "\n\n\n# Install"));
  try {
    const report = await doctor(dir, { build: join(dir, "dist") });
    assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.lines" && f.file === "src/content/docs/guides/intro.md"), JSON.stringify(report.findings));
  } finally {
    writeFileSync(intro, before);
  }
});

test("urlOf gives the URL Starlight derives from a content file's path", () => {
  assert.equal(urlOf("src/content/docs/index.md"), "/");
  assert.equal(urlOf("src/content/docs/about.md"), "/about/");
  assert.equal(urlOf("src/content/docs/guides/index.mdx"), "/guides/");
  assert.equal(urlOf("src/content/docs/guides/intro.md"), "/guides/intro/");
});

test("headingLines finds ATX and setext headings outside front matter and fences", () => {
  const raw = "---\ntitle: T\n---\n\n# One\n\n```\n## Fenced\n```\n\nSetext\n------\n\n## Two ##\n";
  assert.deepEqual(headingLines(raw), [
    { level: 1, line: 5, text: "One" },
    { level: 2, line: 11, text: "Setext" },
    { level: 2, line: 14, text: "Two" },
  ]);
});

test("linksIn skips front matter, fences, code spans, and images", () => {
  const raw = '---\nlink: "[x](front)"\n---\n[a](one.md) and [b](two.md "Title")\n~~~\n[c](fenced)\n~~~\n`[d](span)` ![e](img.png) [f](https://x.test/a_(b))\n';
  assert.deepEqual(linksIn(raw), [{ href: "one.md", line: 4 }, { href: "two.md", line: 4 }, { href: "https://x.test/a_(b)", line: 8 }]);
});

test("headingsIn reads level, id, data-source, and the visible text", () => {
  const html = '<h2 data-source="docs/a.md:3" class="anchor" id="whats-new">What&#x27;s <code>new</code>?</h2><h3>Plain</h3>';
  assert.deepEqual(headingsIn(html), [
    { level: 2, id: "whats-new", source: "docs/a.md:3", text: "What's new?" },
    { level: 3, id: undefined, source: undefined, text: "Plain" },
  ]);
});

test("twins sit at the page's address with .md, under a title heading unless the page starts with one", () => {
  assert.equal(twinUrl("/guides/intro/"), "/guides/intro/index.md");
  assert.equal(twinUrl("/guides/intro.html"), "/guides/intro.md");
  assert.equal(twinOf("---\ntitle: T\n---\n\nBody\n", "T"), "# T\n\nBody\n");
  assert.equal(twinOf("---\ntitle: T\n---\n# Own\n", "T"), "# Own\n");
});

test("the starter AGENTS.md names the folders a Starlight site has, and its schema exists", () => {
  const text = readFileSync(join(adapter, "starter/AGENTS.md"), "utf8");
  for (const path of ["src/content/docs/", "src/content.config.ts", "astro.config.mjs", "dist/", "content-schemas.json", "schema/front-matter.schema.json"]) {
    assert.ok(text.includes(`\`${path}\``), `AGENTS.md does not name ${path}`);
  }
  const index = JSON.parse(readFileSync(join(adapter, "starter/content-schemas.json"), "utf8"));
  for (const entry of index.schemas) assert.ok(existsSync(join(adapter, "starter", entry.schema)), entry.schema);
});
