import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { root } from "../theme/tokens.mjs";

const dir = join(root, "starters/portfolio");
const frontMatter = (file) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dir, file), "utf8"));
  return match ? (parse(match[1]) ?? {}) : {};
};
const posts = readdirSync(join(dir, "_posts")).filter((file) => file.endsWith(".md"));

test("the portfolio starter has the expected files and case studies", () => {
  assert.ok(existsSync(dir), "starters/portfolio exists");
  for (const file of [
    ".vscode/settings.json",
    "404.md",
    "AGENTS.md",
    "README.md",
    "_config.remote.yml",
    "_config.yml",
    "_data/navigation.yml",
    "about.md",
    "contact.md",
    "index.md",
    "llms-full.txt",
    "llms.txt",
    "search.json",
    "sitemap.xml",
    "work.md",
  ]) {
    assert.ok(existsSync(join(dir, file)), `${file} exists`);
  }
  assert.ok(posts.length >= 3, "at least three case studies");

  const files = readdirSync(dir);
  assert.ok(!files.includes("sourcemap.json"), "no sourcemap.json: the starter is built on classic Pages");
  assert.ok(!files.some((file) => file.endsWith(".twin.html")), "no twin HTML files");
});

test("every case study has a date in its name and the same four headings", () => {
  for (const file of posts) {
    assert.match(file, /^\d{4}-\d{2}-\d{2}-[a-z0-9-]+\.md$/, file);
    const data = frontMatter(`_posts/${file}`);
    assert.equal(data.layout, "post", file);
    assert.ok(data.title, `${file} has a title`);
    assert.ok(data.description, `${file} has a description`);
    assert.ok(data.tags.includes("case-study"), `${file} is tagged case-study`);

    const body = readFileSync(join(dir, "_posts", file), "utf8");
    const headings = [...body.matchAll(/^## (.+)$/gm)].map((match) => match[1]);
    assert.deepEqual(headings, ["The problem", "What we did", "What shipped", "The result"], file);
  }
});

test("the home page, the archive, and the header agree on what the site has", () => {
  const index = frontMatter("index.md");
  assert.equal(index.layout, "home");
  assert.equal(index.variant, undefined, "the editorial variant is the default");
  assert.equal(index.posts_limit, 3);

  const work = frontMatter("work.md");
  assert.equal(work.layout, "archive");
  assert.equal(work.permalink, "/work/");

  const urls = new Set(["/", "/work/", "/about/", "/contact/"]);
  const navigation = parse(readFileSync(join(dir, "_data/navigation.yml"), "utf8"));
  for (const item of navigation.main) assert.ok(urls.has(item.url), `${item.title} points at a page`);
});

test("the agent guide stays out of the built site", () => {
  assert.equal(frontMatter("AGENTS.md").published, false);
});
