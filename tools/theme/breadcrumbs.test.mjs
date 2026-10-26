import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";
import { jsonLd } from "./jsonld.test.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

function htmlPages(dir) {
  return readdirSync(dir, { recursive: true }).filter((p) => p.endsWith(".html") && !p.startsWith("assets"));
}

test("breadcrumbs are included in the doc and page layouts", () => {
  const doc = read("_layouts/doc.html");
  assert.match(doc, /\{% include breadcrumbs\.html %\}/);

  const page = read("_layouts/page.html");
  assert.match(page, /\{% include breadcrumbs\.html %\}/);
});

test("breadcrumbs and BreadcrumbList JSON-LD are generated for nested pages", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-breadcrumbs"), "docs");

  const nestedPageHTML = readFileSync(join(out, "guide/install/index.html"), "utf8");

  // Verify HTML breadcrumbs
  assert.match(nestedPageHTML, /<nav class="sl-breadcrumbs"/);
  assert.match(nestedPageHTML, /Guide/);
  assert.match(nestedPageHTML, /Home/);

  // Verify JSON-LD BreadcrumbList
  const blocks = jsonLd(nestedPageHTML);
  const breadcrumbBlock = blocks.find(b => b["@type"] === "BreadcrumbList");
  assert.ok(breadcrumbBlock, "Expected BreadcrumbList JSON-LD block");

  assert.equal(breadcrumbBlock.itemListElement.length, 3);
  assert.equal(breadcrumbBlock.itemListElement[0].name, "Home");
  assert.equal(breadcrumbBlock.itemListElement[1].name, "Guide");
  assert.equal(breadcrumbBlock.itemListElement[2].name, "Install");
});
