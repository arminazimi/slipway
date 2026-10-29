import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");

test("the post layout shows a table of contents only when the front matter asks for it", () => {
  const post = read("_layouts/post.html");
  assert.match(post, /{%- if page\.toc %}/);
  assert.match(post, /sl-toc"/);
  assert.match(post, /on_this_page/);
  // The doc layout may show its TOC unconditionally; the post one must stay opt-in.
  const lines = post.split("\n");
  const toc = lines.findIndex((line) => line.includes("sl-toc"));
  assert.ok(lines.slice(0, toc).some((line) => line.includes("page.toc")));
});

test("the post table of contents links only headings with ids, h2 and h3", () => {
  const post = read("_layouts/post.html");
  assert.match(post, /sl_level == '2' or sl_level == '3'/);
  assert.match(post, /sl_head contains 'id="'/);
  assert.match(post, /class="sl-toc-\{\{ sl_level \}\}"/);
});

test("the reading-progress bar is drawn with CSS, so no JavaScript is needed", () => {
  const css = read("assets/css/slipway.css");
  const progress = css.slice(css.indexOf("Post reading progress"));
  assert.match(progress, /animation-timeline: scroll\(\)/);
  assert.match(progress, /@supports \(animation-timeline: scroll\(\)\)/);
  assert.match(progress, /transform: scaleX\(0\)/);
  // The fill must be invisible when scroll-driven animations are not supported.
  const fill = progress.slice(progress.indexOf(".sl-progress-fill"), progress.indexOf("}", progress.indexOf("transform: scaleX(0)")));
  assert.ok(!fill.includes("animation:"));
  // No script tag for the progress bar in the layout.
  const post = read("_layouts/post.html");
  assert.doesNotMatch(post, /sl-progress[\s\S]{0,400}<script/);
  assert.match(post, /aria-hidden="true"/);
});

test("the front-matter schema documents the toc key for posts", () => {
  const schema = JSON.parse(read("schema/front-matter/post.schema.json"));
  assert.equal(schema.properties.toc.type, "boolean");
});

test("a blog example post turns the table of contents on", () => {
  assert.match(read("examples/blog/_posts/2026-10-20-why-plain-markdown.md"), /^toc: true$/m);
});
