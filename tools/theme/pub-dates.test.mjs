import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateFrontMatter } from "./front-matter.mjs";
import { root } from "./tokens.mjs";
import { tmpDir } from "./tmp.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const fixture = join(root, "tools/theme/fixtures/pub-dates-site");

test("`updated` is a date key every page may set", () => {
  assert.deepEqual(validateFrontMatter({ title: "x", layout: "post", updated: "2026-10-29" }), []);
  assert.equal(validateFrontMatter({ title: "x", layout: "post", updated: "October 29" })[0].key, "updated");
  const schema = JSON.parse(read("schema/front-matter/base.schema.json"));
  assert.equal(schema.properties.updated.$ref, "#/$defs/date");
});

test("the post layout marks an edited post and a scheduled one", () => {
  const post = read("_layouts/post.html");
  assert.match(post, /sl_updated_date != sl_pub_date/);
  assert.match(post, /key='edited_on'/);
  assert.match(post, /page\.date > site\.time/);
  assert.match(post, /key='scheduled'/);
});

test("the feed, the sitemap, and the structured data prefer the updated date", () => {
  assert.match(read("_layouts/feed.html"), /post\.updated \| default: post\.last_modified_at \| default: post\.date/);
  assert.match(read("_layouts/sitemap.html"), /item\.updated \| default: item\.last_modified_at \| default: item\.date/);
  assert.match(read("_includes/jsonld.html"), /page\.updated \| default: page\.last_modified_at \| default: page\.date/);
});

test("every built-in language has the edited_on and scheduled strings", () => {
  for (const lang of ["en", "fa", "ar", "he", "es", "fr", "pt", "de", "it", "ru", "tr", "nl", "ja", "zh", "ur", "ckb", "ps", "yi"]) {
    const block = read(`_includes/i18n/${lang}.html`);
    assert.match(block, /when 'edited_on'/, lang);
    assert.match(block, /when 'scheduled'/, lang);
  }
});

test("a built post shows edited on its updated date, a future one shows Scheduled", { skip }, () => {
  const out = buildExample("gem", tmpDir("pub-dates-post"), fixture);
  const html = (p) => readFileSync(join(out, p), "utf8");
  const edited = html("2026/01/01/edited.html");
  assert.match(edited, /<span class="sl-post-edited">edited on <time datetime="2026-01-05T/);
  assert.doesNotMatch(html("2026/06/01/plain.html"), /sl-post-edited|sl-tag/);
  const scheduled = html("2027/01/01/scheduled.html");
  assert.match(scheduled, /<span class="sl-tag">Scheduled<\/span>/);
  assert.doesNotMatch(scheduled, /sl-post-edited/);
});

test("the feed, the sitemap, and the structured data report the updated date", { skip }, () => {
  const out = buildExample("gem", tmpDir("pub-dates-feed"), fixture);
  const feed = readFileSync(join(out, "feed.xml"), "utf8");
  assert.match(feed, /<published>2026-01-01T[^<]+<\/published>\s*<updated>2026-01-05T/);
  const sitemap = readFileSync(join(out, "sitemap.xml"), "utf8");
  assert.match(sitemap, /<loc>[^<]*\/2026\/01\/01\/edited\.html<\/loc>\s*<lastmod>2026-01-05T/);
  const jsonld = readFileSync(join(out, "2026/01/01/edited.html"), "utf8");
  assert.match(jsonld, /"datePublished":"2026-01-01T[^"]+","dateModified":"2026-01-05T/);
});

test("the blog example shows the edited date on the post that sets it", { skip }, () => {
  const out = buildExample("gem", tmpDir("pub-dates-blog"), "blog");
  const post = readFileSync(join(out, "2026/06/21/hello-blog.html"), "utf8");
  assert.match(post, /<span class="sl-post-edited">edited on <time datetime="2026-06-28T/);
});
