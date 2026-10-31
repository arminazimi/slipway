import assert from "node:assert/strict";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

import { startTags } from "../../packages/doctor/src/html.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

function writeFixture(name, pageContent) {
  const outDir = join(root, `.tmp/block-figure-${name}-out`);
  const testSite = join(root, `.tmp/block-figure-${name}-site`);

  mkdirSync(testSite, { recursive: true });
  writeFileSync(join(testSite, "_config.yml"), "theme: slipway-theme\n");
  writeFileSync(join(testSite, "index.md"), pageContent);
  mkdirSync(join(testSite, "_layouts"), { recursive: true });
  writeFileSync(
    join(testSite, "_layouts", "default.html"),
    `<!DOCTYPE html>
<html lang="en">
<head><title>Test</title></head>
<body>{{ content }}</body>
</html>`,
  );

  buildExample("template", outDir, testSite);
  return readFileSync(join(outDir, "index.html"), "utf8");
}

test("figure block renders a responsive image with caption and credit", { skip }, () => {
  const html = writeFixture(
    "render",
    `---
layout: default
figure:
  src: /assets/images/social.png
  alt: A test image
  caption: 'A <em>nice</em> photo'
  credit: Example Photographer
  credit_url: https://example.com/photo
  width: 1200
  height: 630
  srcset: "/assets/images/social.png 1x, /assets/images/social.png 2x"
  sizes: "(min-width: 40em) 50vw, 100vw"
eager:
  src: /assets/images/social.png
  alt: Eager image
  loading: eager
---
{% include blocks/figure.html src=page.figure.src alt=page.figure.alt caption=page.figure.caption credit=page.figure.credit credit_url=page.figure.credit_url width=page.figure.width height=page.figure.height srcset=page.figure.srcset sizes=page.figure.sizes %}
{% include blocks/figure.html src=page.eager.src alt=page.eager.alt loading=page.eager.loading %}`,
  );

  const tags = startTags(html);
  const figures = tags.filter((tag) => tag.name === "figure" && tag.attributes.get("class") === "sl-figure");
  assert.equal(figures.length, 2, "Should render one figure per include");

  const images = tags.filter((tag) => tag.name === "img").map((tag) => Object.fromEntries(tag.attributes));
  assert.deepEqual(images[0], {
    src: "/assets/images/social.png",
    alt: "A test image",
    srcset: "/assets/images/social.png 1x, /assets/images/social.png 2x",
    sizes: "(min-width: 40em) 50vw, 100vw",
    width: "1200",
    height: "630",
    loading: "lazy",
    decoding: "async",
  });
  assert.equal(images[1].loading, "eager", "Should honor a custom loading value");
  assert.equal(images[1].decoding, "async", "Should keep the default decoding value");

  const credit = tags.find(
    (tag) => tag.name === "a" && tag.attributes.get("href") === "https://example.com/photo",
  );
  assert.ok(credit, "Should render the credit as a link to credit_url");
  assert.equal(credit.attributes.get("rel"), "noopener noreferrer");
  assert.equal(credit.attributes.get("target"), "_blank");
  assert.ok(html.includes(">Example Photographer</a>"), "Should escape and render the credit text");

  assert.ok(html.includes("&lt;em&gt;nice&lt;/em&gt;"), "Should escape HTML in the caption");
  assert.ok(!html.includes("<em>nice</em>"), "Should not render HTML from the caption");

  assert.ok(
    tags.some(
      (tag) =>
        tag.name === "link" &&
        tag.attributes.get("rel") === "stylesheet" &&
        tag.attributes.get("href") === "/assets/css/components/figure.css",
    ),
    "Should link the figure component CSS",
  );
});

test("figure block renders nothing without src", { skip }, () => {
  const html = writeFixture(
    "empty",
    `---
layout: default
---
{% include blocks/figure.html alt="No source" caption="No image" %}`,
  );

  assert.ok(!html.includes("sl-figure"), "Should render no figure without src");
  assert.ok(!html.includes("<img"), "Should render no image without src");
  assert.ok(!html.includes("/assets/css/components/figure.css"), "Should not link the CSS without src");
});
