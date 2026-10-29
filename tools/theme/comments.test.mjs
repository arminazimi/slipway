import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { buildExample, bundleAvailable, root } from "./build.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

const repo = ["    repo: octocat/smile", "    repoId: R_kgDOdemo", "    category: Announcements", "    categoryId: DIC_kwDOdemo"];

/** A one-post site: comments render on posts, so the fixture needs one. */
function fixtureSite(config) {
  const dir = mkdtempSync(join(tmpdir(), "slipway-comments-"));
  const site = join(dir, "site");
  mkdirSync(join(site, "_posts"), { recursive: true });
  writeFileSync(join(site, "_config.yml"), config);
  writeFileSync(
    join(site, "_posts", "2026-01-01-hello.md"),
    "---\ntitle: Hello\ndescription: A post to hang comments on.\nlayout: post\npermalink: /hello.html\n---\n\nHello.\n"
  );
  return { dir, site, out: join(dir, "out") };
}

function build(config) {
  const fixture = fixtureSite(config);
  try {
    buildExample("template", fixture.out, fixture.site);
    return readFileSync(join(fixture.out, "hello.html"), "utf8");
  } finally {
    rmSync(fixture.dir, { recursive: true, force: true });
  }
}

function commentsConfig(lang = "", more = []) {
  const lines = ["title: Comments fixture"];
  if (lang) lines.push(`lang: ${lang}`);
  lines.push("slipway:", "  comments:", ...repo, ...more);
  return lines.join("\n");
}

test("the post layout renders the comments at the end of the article", () => {
  const post = readFileSync(join(root, "_layouts/post.html"), "utf8");
  const include = post.indexOf("{%- include comments.html page=page %}");
  const end = post.indexOf("</article>");
  assert.ok(include > -1, "post.html must include comments.html");
  assert.ok(include < end, "the comments include must come before </article>");
});

test("posts have no comments when slipway.comments is unset", { skip }, () => {
  const html = build("title: Comments fixture\n");
  assert.ok(!html.includes("giscus"));
  assert.ok(!html.includes("sl-comments"));
});

test("configured comments render the giscus embed with the documented attributes", { skip }, () => {
  const html = build(commentsConfig());
  assert.ok(html.includes('<section class="sl-comments">'));
  assert.ok(html.includes("<h2>Comments</h2>"));
  assert.ok(html.includes('id="sl-giscus" defer src="https://giscus.app/client.js" crossorigin="anonymous"'));
  assert.ok(html.includes('data-repo="octocat/smile"'));
  assert.ok(html.includes('data-repo-id="R_kgDOdemo"'));
  assert.ok(html.includes('data-category="Announcements"'));
  assert.ok(html.includes('data-category-id="DIC_kwDOdemo"'));
  assert.ok(html.includes('data-mapping="pathname"'));
  assert.ok(html.includes('data-reactions-enabled="1"'));
  assert.ok(html.includes('data-emit-metadata="0"'));
  assert.ok(html.includes('data-theme="light"'));
  assert.ok(html.includes('data-lang="en"'));
});

test("the embed follows the site's light and dark mode", { skip }, () => {
  const html = build(commentsConfig());
  assert.ok(html.includes('data-light="light" data-dark="dark"'));
  assert.ok(html.includes('g.setAttribute("data-theme",theme())'), "the initial theme must follow the current mode before client.js runs");
  assert.ok(html.includes('attributeFilter:["data-theme"]'), "the toggle changes data-theme on <html>, so watch that attribute");
  assert.ok(html.includes('postMessage({giscus:{setConfig:{theme:theme()}}},"https://giscus.app")'));
  assert.ok(html.includes('matchMedia("(prefers-color-scheme: dark)")'), "auto mode has no data-theme attribute, so read the OS setting");
});

test("the mapping, the theme names, and the language are configurable", { skip }, () => {
  const html = build(commentsConfig("", ["    mapping: title", "    light: light_high_contrast", "    dark: dark_dimmed", "    lang: zh-CN"]));
  assert.ok(html.includes('data-mapping="title"'));
  assert.ok(html.includes('data-theme="light_high_contrast"'));
  assert.ok(html.includes('data-light="light_high_contrast" data-dark="dark_dimmed"'));
  assert.ok(html.includes('data-lang="zh-CN"'));
});

test("a right-to-left site gets the heading and giscus in its language", { skip }, () => {
  const html = build(commentsConfig("fa"));
  assert.ok(html.includes('<html lang="fa" dir="rtl">'));
  assert.ok(html.includes("<h2>دیدگاه‌ها</h2>"));
  assert.ok(html.includes('data-lang="fa"'));
});

test("a language giscus does not know falls back to en", { skip }, () => {
  const html = build(commentsConfig("ur"));
  assert.ok(html.includes("<h2>تبصرے</h2>"));
  assert.ok(html.includes('data-lang="en"'));
});
