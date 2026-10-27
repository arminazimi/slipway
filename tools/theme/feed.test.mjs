import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

/** Every tag closes in order: enough to catch an unescaped character or a stray tag in our simple XML. */
export function wellFormed(xml) {
  const stack = [];
  const body = xml.replace(/<\?xml[^>]*\?>/, "");
  for (const [, close, name, selfClosing] of body.matchAll(/<(\/?)([A-Za-z][\w:-]*)[^>]*?(\/?)>/g)) {
    if (selfClosing) continue;
    if (!close) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0 && !/&(?!(amp|lt|gt|quot|apos|#\d+);)/.test(body);
}

test("the checker accepts good XML and rejects broken XML", () => {
  assert.equal(wellFormed('<?xml version="1.0"?><a><b x="1"/><c>t</c></a>'), true);
  assert.equal(wellFormed("<a><b></a>"), false);
  assert.equal(wellFormed("<a>Tom & Jerry</a>"), false);
});

test("feed and sitemap layouts are plain Liquid with no plugin tags", () => {
  assert.match(read("_layouts/feed.html"), /http:\/\/www\.w3\.org\/2005\/Atom/);
  assert.match(read("_layouts/sitemap.html"), /xmlns:xhtml/);
  assert.doesNotMatch(read("_layouts/feed.html") + read("_layouts/sitemap.html"), /feed_meta|seo_tag|jekyll_sitemap/);
});

test("the head advertises the feed of the page language only when one exists", () => {
  assert.match(read("_includes/head.html"), /layout-url\.html layout='feed'/);
});

test("each language has its own Atom feed with its own posts, and the sitemap links the translations", { skip }, () => {
  const out = buildExample("gem", tmpDir("feed-site"));
  const get = (p) => readFileSync(join(out, p), "utf8");
  const en = get("feed.xml");
  const fa = get("fa/feed.xml");
  assert.ok(wellFormed(en) && wellFormed(fa));
  assert.match(en, /<feed xmlns="http:\/\/www\.w3\.org\/2005\/Atom" xml:lang="en">/);
  assert.match(fa, /xml:lang="fa"/);
  assert.equal([...en.matchAll(/<entry>/g)].length, 2);
  assert.equal([...fa.matchAll(/<entry>/g)].length, 3);
  assert.match(en, /<link href="https?:\/\/[^"]+\/2026\/10\/20\/second-post\.html" rel="alternate"/);
  assert.match(en, /<summary>The second post\.<\/summary>/);
  assert.match(en, /<updated>2026-10-20T/);
  assert.doesNotMatch(en, /نوشتهٔ/);
  assert.match(get("index.html"), /<link rel="alternate" type="application\/atom\+xml" href="\/feed\.xml"/);
  assert.match(get("fa/index.html"), /href="\/fa\/feed\.xml"/);

  const sitemap = get("sitemap.xml");
  assert.ok(wellFormed(sitemap));
  assert.match(sitemap, /<loc>https?:\/\/[^<]+\/docs\/layouts\/<\/loc>/);
  assert.doesNotMatch(sitemap, /feed\.xml|search\.json|sitemap\.xml/);
  for (const lang of ["en", "fa", "de"]) assert.match(sitemap, new RegExp(`<xhtml:link rel="alternate" hreflang="${lang}" href="https?://[^"]+"/>`));
});
