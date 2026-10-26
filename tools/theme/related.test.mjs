import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("the post layout lists related posts by shared tags, in the same language, without JavaScript", () => {
  assert.match(read("_layouts/post.html"), /include related-posts\.html page=page/);
  const related = read("_includes/related-posts.html");
  assert.match(related, /sl_r_page\.tags contains tag/);
  assert.match(related, /sl_r_post_lang != sl_r_lang/);
  assert.match(related, /limit: 3/);
  assert.doesNotMatch(related, /<script/);
});

test("the related styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  const start = css.indexOf(".sl-related {");
  assert.ok(start > 0);
  assert.doesNotMatch(css.slice(start, css.indexOf(".sl-pager {")), /\b(left|right|margin-left|margin-right|padding-left|padding-right)\s*:/);
});

test("related posts rank by shared tags, then newest, skip other languages, and stop at three", { skip }, () => {
  const site = mkdtempSync(join(realpathSync(tmpdir()), "slipway-related-"));
  cpSync(join(root, "examples/blog"), site, { recursive: true });
  const post = (date, slug, front) =>
    writeFileSync(join(site, "_posts", `${date}-${slug}.md`), `---\ntitle: ${slug}\nlayout: post\nauthor: ada\n${front}\n---\n\nText.\n`);
  post("2026-01-01", "both-tags", "tags: [writing, markdown]");
  post("2026-02-01", "old-writing", "tags: [writing]");
  post("2026-03-01", "persian-writing", "lang: fa\ntags: [writing, markdown]");
  const out = buildExample("gem", join(root, ".tmp-related-site"), site);
  const html = (p) => readFileSync(join(out, p), "utf8");

  const page = html("2026/10/20/why-plain-markdown.html");
  const nav = page.slice(page.indexOf('<nav class="sl-related"'), page.indexOf("</nav>", page.indexOf('<nav class="sl-related"')));
  assert.match(nav, /<h2 id="sl-related-title">Related posts<\/h2>/);
  const titles = [...nav.matchAll(/<a href="[^"]+">([^<]+)<\/a>/g)].map((m) => m[1]);
  assert.deepEqual(titles, ["both-tags", "A slow site is a broken site", "old-writing"]);
  assert.doesNotMatch(nav, /persian-writing|Why plain Markdown/);

  assert.doesNotMatch(html("2026/08/03/notes-on-type.html"), /sl-related/);
});
