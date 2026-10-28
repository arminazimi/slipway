import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

import { startTags } from "../../packages/doctor/src/html.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("gallery block renders correctly", { skip }, () => {
  const outDir = join(root, ".tmp/block-gallery-out");
  const testSite = join(root, ".tmp/block-gallery-site");

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");

  const pageContent = `---
layout: default
images:
  - src: "test1.jpg"
    alt: "Alt 1"
    caption: "Caption 1"
    credit: "Credit 1"
    lazy: true
    width: 640
    height: 480
    srcset: "test1.jpg 1x, test1@2x.jpg 2x"
  - src: "test2.jpg"
    alt: "Alt 2"
---
{% include blocks/gallery.html images=page.images %}`;

  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });

  const layoutContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Test</title>
  {% include component-css.html name="gallery" %}
</head>
<body>
  {{ content }}
</body>
</html>
  `;
  writeFileSync(join(testSite, "_layouts", "default.html"), layoutContent);

  buildExample("template", outDir, testSite);

  const html = readFileSync(join(outDir, "index.html"), "utf8");

  assert.ok(html.includes('<div class="sl-gallery">'), "Should render gallery wrapper");
  assert.ok(html.includes('<figure class="sl-gallery-item">'), "Should render gallery item");
  const images = startTags(html).filter((tag) => tag.name === "img").map((tag) => Object.fromEntries(tag.attributes));
  assert.deepEqual(images, [
    { src: "/test1.jpg", alt: "Alt 1", srcset: "test1.jpg 1x, test1@2x.jpg 2x", width: "640", height: "480", loading: "lazy" },
    { src: "/test2.jpg", alt: "Alt 2" },
  ]);
  assert.ok(html.includes('<figcaption>'), "Should render figcaption element");
  assert.ok(html.includes('<span class="sl-gallery-caption">Caption 1</span>'), "Should render caption");
  assert.ok(html.includes('<span class="sl-gallery-credit">Credit 1</span>'), "Should render credit");
  assert.ok(startTags(html).some((tag) => tag.name === "link" && tag.attributes.get("rel") === "stylesheet" && tag.attributes.get("href") === "/assets/css/components/gallery.css"), "Should link the gallery component CSS");
});
