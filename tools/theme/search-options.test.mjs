import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { tmpDir } from "./tmp.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

/* A small site with every search option: a site-wide text cap, a page that indexes only its
   description, a page that stays out, and a page whose headings must survive the cap. */
function writeFixture(dir) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(
    join(dir, "_config.yml"),
    ["title: Search options", "lang: en", "theme: slipway-theme", "permalink: pretty", "slipway:", "  search:", "    text: 80", ""].join("\n"),
  );
  writeFileSync(join(dir, "search.json"), "---\nlayout: search-index\nlang: en\npermalink: /search.json\n---\n");
  writeFileSync(
    join(dir, "index.md"),
    [
      "---",
      "title: Home",
      "description: The home page.",
      "---",
      "",
      "The home page opens with enough ordinary prose that the site-wide cap has to shorten it before the index",
      "writes the entry, so the stored text never grows with the page.",
      "",
    ].join("\n"),
  );
  writeFileSync(
    join(dir, "excerpt.md"),
    [
      "---",
      "title: Excerpt page",
      "description: A short summary kept for the index.",
      "search: excerpt",
      "---",
      "",
      "This body is long enough to be cut and must not reach the index at all.",
      "",
      "## A heading that stays",
      "",
      "More prose under the heading.",
      "",
    ].join("\n"),
  );
  writeFileSync(join(dir, "off.md"), "---\ntitle: Off\nsearch: false\n---\n\nThis page stays out of the index.\n");
}

test("a site cap shortens the text, search: excerpt keeps the description, and headings survive", { skip }, () => {
  const src = tmpDir("search-options-site");
  writeFixture(src);
  const out = buildExample("gem", tmpDir("search-options-out"), src);
  const entries = JSON.parse(readFileSync(join(out, "search.json"), "utf8"));
  const byUrl = Object.fromEntries(entries.map((entry) => [entry.url, entry]));

  assert.ok(byUrl["/"] , "the home page is indexed");
  assert.ok(byUrl["/"].text.length <= 80, `text is ${byUrl["/"].text.length} characters`);
  assert.match(byUrl["/"].text, /^The home page opens/);

  assert.equal(byUrl["/excerpt/"].text, "A short summary kept for the index.");
  assert.equal(byUrl["/excerpt/"].headings, "A heading that stays");
  assert.doesNotMatch(JSON.stringify(byUrl["/excerpt/"]), /This body is long enough/);

  assert.equal(byUrl["/off/"], undefined);
});
