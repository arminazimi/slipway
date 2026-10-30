import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { root } from "../theme/tokens.mjs";

const dir = join(root, "starters/project");
const frontMatter = (file) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dir, file), "utf8"));
  return match ? (parse(match[1]) ?? {}) : {};
};

test("the project starter has the expected files", () => {
  assert.ok(existsSync(dir), "starters/project exists");
  for (const file of [
    ".vscode/settings.json",
    "404.md",
    "AGENTS.md",
    "README.md",
    "_config.remote.yml",
    "_config.yml",
    "_data/navigation.yml",
    "contributing.md",
    "docs/api.md",
    "docs/index.md",
    "docs/install.md",
    "docs/quick-start.md",
    "index.md",
    "llms-full.txt",
    "llms.txt",
    "search.json",
    "sitemap.xml",
    "support.md",
  ]) {
    assert.ok(existsSync(join(dir, file)), `${file} exists`);
  }

  const files = readdirSync(dir);
  assert.ok(!files.includes("sourcemap.json"), "no sourcemap.json: the starter is built on classic Pages");
  assert.ok(!files.some((file) => file.endsWith(".twin.html")), "no twin HTML files");
});

test("the landing page sends readers to the docs and its install step", () => {
  const index = frontMatter("index.md");
  assert.equal(index.layout, "home");
  assert.equal(index.variant, "landing");
  assert.equal(index.cta_url, "/docs/install/");
  assert.ok(index.features.length >= 3, "at least three feature cards");
  for (const feature of index.features) assert.ok(feature.url.startsWith("/"), `${feature.title} links`);
});

test("the header and the sidebar point at pages the site has", () => {
  const pages = {
    "docs/index.md": "/docs/",
    "docs/install.md": "/docs/install/",
    "docs/quick-start.md": "/docs/quick-start/",
    "docs/api.md": "/docs/api/",
  };
  const urls = new Set(["/", "/contributing/", "/support/"]);
  for (const [file, url] of Object.entries(pages)) {
    const data = frontMatter(file);
    assert.equal(data.layout, "doc", file);
    assert.equal(data.permalink, url, file);
    urls.add(data.permalink);
  }
  assert.equal(frontMatter("contributing.md").layout, "page");
  assert.equal(frontMatter("support.md").layout, "page");

  const navigation = parse(readFileSync(join(dir, "_data/navigation.yml"), "utf8"));
  const sidebar = navigation.docs.flatMap((group) => group.children ?? []);
  assert.ok(sidebar.length >= 4, "the sidebar lists the guide");
  for (const item of [...navigation.main, ...sidebar]) {
    assert.ok(urls.has(item.url), `${item.title} points at a page (${item.url})`);
  }
});

test("the agent guide stays out of the built site", () => {
  assert.equal(frontMatter("AGENTS.md").published, false);
});
