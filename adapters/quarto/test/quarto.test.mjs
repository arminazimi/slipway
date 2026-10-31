// Builds the fixture site with the Quarto adapter and checks what it writes with slipway doctor.
// Needs Quarto 1.4 or later on the PATH (or set QUARTO); the build tests skip without it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";
import { headingsIn, linksIn, splitFrontMatter, titleOf, twinOf, twinUrl } from "../_extensions/slipway/markdown.mjs";
import { writeSite } from "../_extensions/slipway/post-render.mjs";

const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const quarto = process.env.QUARTO ?? "quarto";
const skip = spawnSync(quarto, ["--version"]).status === 0 ? false : "install Quarto 1.4 or later (or set QUARTO) to run it";

/** Copies the fixture, the starter files, and the extension into a temporary folder, and builds it. */
function build(t, edit = () => {}) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-quarto-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, dir, { recursive: true });
  cpSync(join(adapter, "starter"), dir, { recursive: true });
  cpSync(join(adapter, "_extensions"), join(dir, "_extensions"), { recursive: true });
  edit(dir);
  const result = spawnSync(quarto, ["render"], { cwd: dir, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return dir;
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async (t) => {
  const dir = build(t);
  const report = await doctor(dir, { build: join(dir, "_site") });
  // L3 needs the agent-skills index, which this adapter does not write.
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "quarto");
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every page with a file, with headings and links at their source lines", { skip }, (t) => {
  const dir = build(t);
  const map = JSON.parse(read(dir, "_site/sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => `${p.url} ${p.source}`), ["/ index.qmd", "/docs/intro.html docs/intro.qmd"]);
  assert.deepEqual(page(map, "/").sections, [{ id: "welcome", level: 2, line: 6, text: "Welcome" }]);
  assert.deepEqual(page(map, "/").links, [{ href: "docs/intro.qmd", line: 8 }]);
  assert.deepEqual(page(map, "/docs/intro.html").sections, [
    { id: "install-the-package", level: 1, line: 6, text: "Install the package" },
    { id: "what-is-new", level: 2, line: 10, text: "What is new?" },
    { id: "custom-notes", level: 2, line: 17, text: "Notes" },
    { id: "setext-heading", level: 1, line: 21, text: "Setext heading" },
    { id: "notes", level: 2, line: 24, text: "Notes" },
  ]);
  // Images, code spans, and front matter are not links.
  assert.deepEqual(page(map, "/docs/intro.html").links, [
    { href: "../index.qmd", line: 8 },
    { href: "../index.qmd", line: 19 },
  ]);
});

test("every heading carries data-source with its source path and line", { skip }, (t) => {
  const dir = build(t);
  const html = read(dir, "_site/docs/intro.html");
  const sections = headingsIn(html)
    .filter((heading) => heading.source?.startsWith("docs/intro.qmd:"))
    .map(({ id, level, source, text }) => [id, level, source, text]);
  assert.deepEqual(sections, [
    ["install-the-package", 1, "docs/intro.qmd:6", "Install the package"],
    ["what-is-new", 2, "docs/intro.qmd:10", "What is new?"],
    ["custom-notes", 2, "docs/intro.qmd:17", "Notes"],
    ["setext-heading", 1, "docs/intro.qmd:21", "Setext heading"],
    ["notes", 2, "docs/intro.qmd:24", "Notes"],
  ]);
  const home = headingsIn(read(dir, "_site/index.html")).filter((heading) => heading.source?.startsWith("index.qmd:"));
  assert.deepEqual(home.map(({ id, level, source, text }) => [id, level, source, text]), [["welcome", 2, "index.qmd:6", "Welcome"]]);
  assert.doesNotMatch(html, /<h[1-6][^>]*>Not a heading<\/h/);
});

test("each page has a Markdown twin, linked from its head", { skip }, (t) => {
  const dir = build(t);
  assert.ok(read(dir, "_site/docs/intro.md").startsWith("# Install the *package*\n\n"), read(dir, "_site/docs/intro.md"));
  assert.ok(read(dir, "_site/index.md").startsWith("# Home\n\n## Welcome\n"), read(dir, "_site/index.md"));
  assert.match(read(dir, "_site/docs/intro.html"), /<link rel="alternate" type="text\/markdown" href="\/docs\/intro\.md">/);
  assert.match(read(dir, "_site/index.html"), /<link rel="alternate" type="text\/markdown" href="\/index\.md">/);
});

test("a stale heading line is caught by slipway doctor", { skip }, async (t) => {
  // The map is written from the source, so editing the source after a build leaves it stale.
  const dir = build(t);
  const intro = join(dir, "docs/intro.qmd");
  writeFileSync(intro, "\n\n" + readFileSync(intro, "utf8"));
  const report = await doctor(dir, { build: join(dir, "_site") });
  assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.lines" && f.file === "docs/intro.qmd"), JSON.stringify(report.findings));
});

test("the starter AGENTS.md names only paths a Quarto site has", () => {
  const text = readFileSync(join(adapter, "starter/AGENTS.md"), "utf8");
  for (const path of ["index.qmd", "docs/", "_site/", "_quarto.yml", "content-schemas.json", "schema/front-matter.schema.json", "_extensions/slipway/"]) {
    assert.ok(text.includes(`\`${path}\``), `AGENTS.md does not name ${path}`);
  }
  const index = JSON.parse(readFileSync(join(adapter, "starter/content-schemas.json"), "utf8"));
  for (const entry of index.schemas) assert.ok(existsSync(join(adapter, "starter", entry.schema)), entry.schema);
  const config = readFileSync(join(adapter, "starter/_quarto.yml"), "utf8");
  assert.match(config, /post-render: node _extensions\/slipway\/post-render\.mjs/);
  assert.match(config, /section-divs: false/);
  assert.match(config, /filters:\s*\n\s*- slipway/);
});

test("linksIn finds inline links outside front matter, fences, and code spans", () => {
  const raw = [
    "---",
    "title: T",
    "link: [x](front-matter.md)",
    "---",
    "",
    "[a](one.md) ![image](pic.png) `[b](two.md)`",
    "```sh",
    "[c](three.md)",
    "```",
    "[d](four.md)",
  ].join("\n");
  assert.deepEqual(linksIn(raw), [
    { href: "one.md", line: 6 },
    { href: "four.md", line: 10 },
  ]);
});

test("headingsIn reads ids, levels, data-source, and the text a reader sees", () => {
  const html = [
    '<h1 id="install-the-package" class="anchored" data-source="docs/intro.qmd:6">Install the <em>package</em><a class="anchor" href="#install-the-package" aria-hidden="true"></a></h1>',
    '<h2 id="notes" data-source="docs/intro.qmd:24">Notes &amp; more</h2>',
    "<h3>No source</h3>",
  ].join("\n");
  assert.deepEqual(headingsIn(html), [
    { level: 1, id: "install-the-package", source: "docs/intro.qmd:6", text: "Install the package" },
    { level: 2, id: "notes", source: "docs/intro.qmd:24", text: "Notes & more" },
    { level: 3, id: undefined, source: undefined, text: "No source" },
  ]);
});

test("splitFrontMatter, titleOf, twinUrl, and twinOf handle the twin rules", () => {
  const raw = '---\ntitle: "Intro"\ndescription: A page.\n---\n\n# Install\n\nBody\n';
  const { body, offset } = splitFrontMatter(raw);
  assert.equal(offset, 4);
  assert.equal(body, "\n# Install\n\nBody\n");
  assert.equal(titleOf(raw), "Intro");
  assert.equal(twinUrl("/"), "/index.md");
  assert.equal(twinUrl("/docs/"), "/docs/index.md");
  assert.equal(twinUrl("/docs/intro.html"), "/docs/intro.md");
  assert.equal(twinOf(raw, "Intro"), "# Install\n\nBody\n");
  assert.equal(twinOf("---\ntitle: Intro\n---\n\nBody\n", "Intro"), "# Intro\n\nBody\n");
  assert.equal(titleOf("No front matter\n"), null);
});

test("writeSite writes the map, the twins, and the twin links from the built pages", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-quarto-write-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, "docs"), { recursive: true });
  mkdirSync(join(dir, "_site", "docs"), { recursive: true });
  writeFileSync(join(dir, "index.qmd"), "---\ntitle: Home\n---\n\n## Welcome\n\n[Docs](docs/intro.qmd)\n");
  writeFileSync(join(dir, "docs/intro.qmd"), "---\ntitle: Intro\n---\n\n# Install\n\nSee [home](../index.qmd).\n");
  writeFileSync(
    join(dir, "_site/index.html"),
    '<html><head><title>Home</title></head><body><h2 id="welcome" data-source="index.qmd:5">Welcome</h2></body></html>\n',
  );
  writeFileSync(
    join(dir, "_site/docs/intro.html"),
    '<html><head></head><body><h1 id="install" data-source="docs/intro.qmd:5">Install</h1></body></html>\n',
  );
  // A built page with no source file, and a source file with no built page, are both left out.
  writeFileSync(join(dir, "_site/docs/extra.html"), "<html><body><h1>Extra</h1></body></html>\n");
  writeFileSync(join(dir, "docs/draft.qmd"), "# Draft\n");

  const map = writeSite({ site: dir, outDir: join(dir, "_site") });
  assert.deepEqual(map, {
    version: 0,
    pages: [
      { url: "/", source: "index.qmd", sections: [{ id: "welcome", level: 2, line: 5, text: "Welcome" }], links: [{ href: "docs/intro.qmd", line: 7 }] },
      {
        url: "/docs/intro.html",
        source: "docs/intro.qmd",
        sections: [{ id: "install", level: 1, line: 5, text: "Install" }],
        links: [{ href: "../index.qmd", line: 7 }],
      },
    ],
  });
  assert.deepEqual(JSON.parse(read(dir, "_site/sourcemap.json")), map);
  assert.equal(read(dir, "_site/index.md"), "# Home\n\n## Welcome\n\n[Docs](docs/intro.qmd)\n");
  assert.equal(read(dir, "_site/docs/intro.md"), "# Install\n\nSee [home](../index.qmd).\n");
  assert.match(read(dir, "_site/index.html"), /<link rel="alternate" type="text\/markdown" href="\/index\.md">/);
  assert.match(read(dir, "_site/docs/intro.html"), /<link rel="alternate" type="text\/markdown" href="\/docs\/intro\.md">\n<\/head>/);
});
