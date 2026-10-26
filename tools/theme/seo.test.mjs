import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const head = (html) => html.split("</head>")[0];

test("the head writes social meta in plain Liquid, with no jekyll-seo-tag", () => {
  assert.match(read("_includes/head.html"), /include seo\.html/);
  assert.doesNotMatch(read("_includes/seo.html"), /seo_tag|\{%-? seo/);
});

test("the theme ships a 1200 by 630 PNG as the default social image", () => {
  const png = readFileSync(join(root, "assets/images/social.png"));
  assert.equal(png.subarray(1, 4).toString(), "PNG");
  assert.deepEqual([png.readUInt32BE(16), png.readUInt32BE(20)], [1200, 630]);
});

test("pages get a canonical link, Open Graph, a Twitter card, and hreflang alternates of their translations", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-seo-site"));
  const fa = head(readFileSync(join(out, "fa/index.html"), "utf8"));
  assert.match(fa, /<link rel="canonical" href="https?:\/\/[^"]+\/fa\/">/);
  assert.match(fa, /<meta property="og:type" content="website">/);
  assert.match(fa, /<meta property="og:title" content="سلام اسلیپ‌وی">/);
  assert.match(fa, /<meta property="og:site_name" content="Slipway minimal">/);
  assert.match(fa, /<meta property="og:locale" content="fa">/);
  assert.match(fa, /<meta property="og:description" content="[^"]+">/);
  assert.match(fa, /<meta property="og:image" content="https?:\/\/[^"]+\/assets\/images\/social\.png">/);
  assert.match(fa, /<meta name="twitter:card" content="summary">/);
  for (const lang of ["en", "fa", "de"]) assert.match(fa, new RegExp(`<link rel="alternate" hreflang="${lang}" href="https?://[^"]+">`));
  assert.match(fa, /<link rel="alternate" hreflang="x-default" href="https?:\/\/[^"]+\/">/);
  assert.match(fa, /<meta property="og:locale:alternate" content="en">/);
  assert.doesNotMatch(fa, /og:locale:alternate" content="fa"/);

  const post = head(readFileSync(join(out, "2026/10/20/second-post.html"), "utf8"));
  assert.match(post, /<meta property="og:type" content="article">/);
  assert.match(post, /<meta property="article:published_time" content="2026-10-20T/);
  assert.doesNotMatch(post, /hreflang=/);
});
