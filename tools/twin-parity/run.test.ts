import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { builtSite } from "../fixture-build/build.ts";
import { compareSite, firstDifference, htmlBlocks, normalize, twinBlocks } from "./run.ts";

/** A build folder with one page in its manifest and the two files a parity check reads. */
function outputFolder(t: { after: (fn: () => void) => void }, files: Record<string, string>, pages: { url: string; outputs: string[] }[] = []): string {
  const dir = mkdtempSync(join(tmpdir(), "twin-parity-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  mkdirSync(join(dir, ".slipway"), { recursive: true });
  writeFileSync(join(dir, ".slipway/manifest.json"), `${JSON.stringify({ version: 1, pages })}\n`);
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

test("normalizes words, not punctuation, case, entities, or tags", () => {
  assert.equal(normalize("<p>Beacon &amp; <code>beacon.yml</code>!</p>"), "beacon beacon yml");
  assert.equal(normalize("  A\tline\nand  another  "), "a line and another");
  assert.equal(normalize("`beacon init` creates beacon.yml."), "beacon init creates beacon yml");
  assert.equal(normalize("۱۲ مگابایت (12 MB)"), "۱۲ مگابایت 12 mb");
});

test("reads the article's content blocks, ignoring layout chrome and a component's label", () => {
  const page = [
    "<!DOCTYPE html><html><body>",
    "<header><p>Site header</p></header>",
    "<main><article>",
    '<nav class="breadcrumb"><a href="/">Guide</a></nav>',
    '<h1 data-src="quickstart.md:1">Quickstart, <code>now</code></h1>',
    '<div class="callout" data-src="quickstart.md:3"><p class="callout-title">Note</p>',
    '<p data-src="quickstart.md:3">Same <strong>text</strong></p></div>',
    '<ul data-src="quickstart.md:5"><li>One</li><li>Two</li></ul>',
    "</article></main>",
    "<footer><p>Site footer</p></footer>",
    "</body></html>",
  ].join("");
  assert.deepEqual(htmlBlocks(page), ["quickstart now", "same text", "one two"]);
});

test("reads the twin's blocks with the engine's parser, including directives", async () => {
  const markdown = [
    "# Quickstart, `now`",
    "",
    ':::callout{type=warning title="A label is a prop, not text"}',
    "Same **text**",
    ":::",
    "",
    "- One",
    "- Two",
    "",
  ].join("\n");
  assert.deepEqual(await twinBlocks(markdown), ["quickstart now", "same text", "one two"]);
});

test("names the first block that differs, including a block one side is missing", () => {
  assert.deepEqual(firstDifference(["one", "two"], ["one", "two"]), undefined);
  assert.deepEqual(firstDifference(["one", "two"], ["one", "three"]), { block: 2, twin: "two", html: "three" });
  assert.deepEqual(firstDifference(["one"], ["one", "two"]), { block: 2, twin: null, html: "two" });
  assert.deepEqual(firstDifference(["one", "two"], ["one"]), { block: 2, twin: "two", html: null });
});

test("passes on fixtures/docs-site", async () => {
  const report = await compareSite(await builtSite("docs-site"));
  assert.equal(report.difference, undefined, report.difference === undefined ? "" : JSON.stringify(report.difference));
  assert.ok(report.pages > 500, "the fixture's pages are all compared");
});

test("fails on a deliberately broken copy of a fixture page", async (t) => {
  const built = await builtSite("docs-site");
  const dir = outputFolder(
    t,
    {
      "quickstart/index.md": readFileSync(join(built, "quickstart/index.md"), "utf8"),
      "quickstart/index.html": readFileSync(join(built, "quickstart/index.html"), "utf8"),
    },
    [{ url: "/quickstart/", outputs: ["quickstart/index.html", "quickstart/index.md"] }],
  );
  const twin = join(dir, "quickstart/index.md");
  writeFileSync(twin, readFileSync(twin, "utf8").replace("Five commands", "Four commands"));

  const report = await compareSite(dir);
  assert.equal(report.pages, 1);
  assert.equal(report.difference?.page, "quickstart/index.md");
  assert.equal(report.difference?.block, 2);
  assert.match(report.difference?.twin ?? "", /four commands/);
  assert.match(report.difference?.html ?? "", /five commands/);
});

test("skips a page whose twin or HTML output is turned off", async (t) => {
  const dir = outputFolder(
    t,
    {
      "only-html/index.html": "<main><p data-src=\"a.md:1\">Text</p></main>",
      "only-twin/index.md": "Text\n",
    },
    [
      { url: "/only-html/", outputs: ["only-html/index.html"] },
      { url: "/only-twin/", outputs: ["only-twin/index.md"] },
    ],
  );
  assert.deepEqual(await compareSite(dir), { pages: 0 });
});

test("a page with an empty twin and no body passes", async (t) => {
  const dir = outputFolder(t, { "404.md": "", "404.html": "<main><h1>Page not found</h1></main>" }, [
    { url: "/404.html", outputs: ["404.html", "404.md"] },
  ]);
  assert.deepEqual(await compareSite(dir), { pages: 1 });
});
