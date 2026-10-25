import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { findPhysical } from "./logical-css.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const customLink = /<link rel="stylesheet" href="\/assets\/css\/custom\.css">/;

test("the theme ships the two include slots empty and no custom.css", () => {
  for (const slot of ["_includes/head-custom.html", "_includes/footer-custom.html"]) {
    assert.equal(read(slot).replace(/\{%-? comment -?%\}[\s\S]*?\{%-? endcomment -?%\}/g, "").trim(), "", slot);
  }
  assert.ok(!existsSync(join(root, "assets/css/custom.css")));
});

test("custom.css loads after the theme styles and config tokens; the slots close head and footer", () => {
  const head = read("_includes/head.html");
  const custom = head.indexOf("custom.css");
  for (const before of ["tokens.css", "slipway.css", "print.css", "theme-vars.html"]) assert.ok(head.indexOf(before) < custom, before);
  assert.match(head, /\{% include head-custom\.html %\}\n<\/head>/);
  assert.match(read("_includes/footer.html"), /\{% include footer-custom\.html %\}\n<\/footer>/);
});

test("docs/overrides.md shows an example for each slot", () => {
  const docs = read("docs/overrides.md");
  for (const slot of ["_includes/head-custom.html", "_includes/footer-custom.html", "assets/css/custom.css"]) {
    assert.ok(docs.includes(`\`${slot}\`:\n\n\`\`\``), slot);
  }
});

test("the docs example's custom.css uses logical properties", () => {
  assert.deepEqual(findPhysical(read("examples/docs/assets/css/custom.css")), []);
});

for (const mode of ["gem", "template"]) {
  test(`a site's own override files fill the slots (${mode})`, { skip }, () => {
    const out = buildExample(mode, join(root, `.tmp-overrides-${mode}`), "docs");
    const html = readFileSync(join(out, "index.html"), "utf8");
    assert.match(html, /<meta name="author" content="Slipway contributors">\s*<\/head>/);
    assert.match(html, /<p class="docs-footer-note">[\s\S]*?<\/p>\s*<\/footer>/);
    assert.match(html, customLink);
    assert.match(readFileSync(join(out, "assets/css/custom.css"), "utf8"), /\.docs-footer-note/);
  });
}

for (const mode of ["gem", "template"]) {
  test(`a site without overrides renders empty slots and no custom.css link (${mode})`, { skip }, () => {
    const out = buildExample(mode, join(root, `.tmp-overrides-minimal-${mode}`));
    const html = readFileSync(join(out, "index.html"), "utf8");
    assert.doesNotMatch(html, /Override slot|custom\.css/);
    assert.match(html, /<\/script>\s*<\/head>/);
    assert.match(html, /<p>[^<]*<\/p>\s*<\/footer>/);
    assert.ok(!existsSync(join(out, "assets/css/custom.css")));
  });
}
