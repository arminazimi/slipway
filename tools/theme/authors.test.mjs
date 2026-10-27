import assert from "node:assert/strict";
import { tmpDir } from "./tmp.mjs";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { siteAuthorProblems, validateAuthors, validateExampleAuthors } from "./authors.mjs";
import { validateFrontMatter } from "./front-matter.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("the authors schema takes a name, bio, avatar, and links, and rejects the rest", () => {
  assert.equal(validateAuthors({ ada: { name: "Ada", bio: "x", avatar: "/a.png", links: [{ title: "Site", url: "https://example.org" }] } }).ok, true);
  for (const bad of [{ ada: {} }, { ada: { name: "" } }, { ada: { name: "A", avatar: "a.png" } }, { ada: { name: "A", email: "a@b" } }, { "a b": { name: "A" } }, { ada: { name: "A", links: [{ title: "x" }] } }]) {
    assert.equal(validateAuthors(bad).ok, false, JSON.stringify(bad));
  }
});

test("a post's author is one id or a list of ids, and an author page needs one", () => {
  assert.deepEqual(validateFrontMatter({ title: "x", layout: "post", author: "ada" }), []);
  assert.deepEqual(validateFrontMatter({ title: "x", layout: "post", author: ["ada", "sam"] }), []);
  assert.equal(validateFrontMatter({ title: "x", layout: "post", author: [] })[0].key, "author");
  assert.equal(validateFrontMatter({ title: "x", layout: "post", author: "Ada Rahimi" })[0].key, "author");
  assert.equal(validateFrontMatter({ title: "x", layout: "author" })[0].key, "author");
  assert.deepEqual(validateFrontMatter({ title: "x", layout: "author", author: "ada" }), []);
});

test("an author id missing from _data/authors.yml is reported with its file", () => {
  const site = mkdtempSync(join(tmpdir(), "slipway-authors-"));
  mkdirSync(join(site, "_data"));
  mkdirSync(join(site, "_posts"));
  writeFileSync(join(site, "_data/authors.yml"), "ada:\n  name: Ada\n");
  writeFileSync(join(site, "_posts/2026-01-01-a.md"), "---\ntitle: A\nauthor: [ada, bob]\n---\n");
  writeFileSync(join(site, "b.md"), "---\ntitle: B\nlayout: author\nauthor: ada\n---\n");
  assert.deepEqual(siteAuthorProblems(site, site), ["_posts/2026-01-01-a.md: author bob is not a key of _data/authors.yml"]);
  assert.deepEqual(validateExampleAuthors(), []);
});

test("the post layout shows a byline and an author box, and the author layout lists the author's posts", () => {
  const post = read("_layouts/post.html");
  assert.match(post, /include byline\.html page=page/);
  assert.match(post, /include author-card\.html id=id link=true/);
  const author = read("_layouts/author.html");
  assert.match(author, /layout: base/);
  assert.match(author, /include author-card\.html id=page\.author/);
  assert.match(author, /sl_post_lang != sl_lang/);
  assert.match(read("_includes/author-ids.html"), /include\.page\.author \| join: ',' \| split: ','/);
});

test("the author styles use logical properties only", () => {
  const css = read("assets/css/slipway.css");
  const start = css.indexOf("/* Authors:");
  assert.ok(start > 0);
  assert.doesNotMatch(css.slice(start, css.indexOf("/* Page layout")), /\b(left|right|margin-left|margin-right|padding-left|padding-right|width|height)\s*:/);
});

test("the blog example shows bylines, author boxes, and author pages", { skip }, () => {
  const out = buildExample("gem", tmpDir("authors-site"), "blog");
  const html = (p) => readFileSync(join(out, p), "utf8");
  const shared = html("2026/09/12/a-slow-site-is-a-broken-site.html");
  assert.match(shared, /<span class="sl-byline">By\s+<a rel="author" href="\/authors\/ada\/">Ada Rahimi<\/a> and\s+<a rel="author" href="\/authors\/sam\/">Sam Okafor<\/a><\/span>/);
  assert.match(shared, /<aside class="sl-authors" aria-label="About the author">/);
  assert.match(shared, /<img class="sl-avatar" src="\/assets\/img\/ada\.svg" alt="" width="64" height="64" loading="lazy">/);
  assert.match(shared, /<p class="sl-author-bio">Edits the blog/);
  assert.match(shared, /<li><a href="https:\/\/example\.org\/ada">Website<\/a><\/li>/);
  const single = html("2026/10/20/why-plain-markdown.html");
  assert.equal((single.match(/class="sl-author"/g) ?? []).length, 1);
  const sam = html("authors/sam/index.html");
  assert.match(sam, /<h2 id="posts">Posts <span class="sl-count">\(2\)<\/span><\/h2>/);
  assert.match(sam, /why-plain-markdown/);
  assert.match(sam, /a-slow-site-is-a-broken-site/);
  assert.doesNotMatch(sam, /notes-on-type/);
  assert.doesNotMatch(html("about.html"), /sl-byline|sl-authors/);
});
