import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample, root } from "./build.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const fixture = join(root, "tools/theme/fixtures/no-front-matter");

// The layout comes from the site's `defaults`, so the fixture builds twice: with the fixture's own
// `layout: page`, and with this overlay switching the default to `layout: doc`.
const overlayDir = tmpDir("title-from-heading");
mkdirSync(overlayDir, { recursive: true });
const docDefaults = join(overlayDir, "doc-defaults.yml");
writeFileSync(docDefaults, ["defaults:", "  - scope:", '      path: ""', "    values:", "      layout: doc", ""].join("\n"));

// For each fixture page: its `<title>` and the text of its one and only h1. Pages without a `title`
// take it from their first heading (jekyll-titles-from-headings); pages that have one keep it.
const pages = {
  "no-front-matter.html": { title: "Heading From Content", h1: "Heading From Content" },
  "title-no-heading.html": { title: "Front Matter Title", h1: "Front Matter Title" },
  "title-and-heading.html": { title: "Front Matter Title", h1: "Heading From Content" },
};

for (const layout of ["page", "doc"]) {
  test(`content starting with an h1 renders exactly one h1 and a matching title (${layout})`, { skip }, () => {
    const out = buildExample("gem", tmpDir(`title-from-heading-${layout}`), fixture, layout === "doc" ? { configs: [docDefaults] } : {});
    for (const [name, expected] of Object.entries(pages)) {
      const html = readFileSync(join(out, name), "utf8");
      assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${name}: exactly one h1`);
      assert.ok(html.includes(`>${expected.h1}</h1>`), `${name}: the h1 is ${expected.h1}`);
      assert.equal(html.match(/<title>(.*?)<\/title>/)?.[1], expected.title, `${name}: the <title>`);
    }
  });
}
