import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { root } from "../theme/tokens.mjs";

const dir = join(root, "starters/tool");
const frontMatter = (file) => {
  const match = /^---\n([\s\S]*?)\n---/.exec(readFileSync(join(dir, file), "utf8"));
  return match ? (parse(match[1]) ?? {}) : {};
};

test("the tool starter has the expected files", () => {
  assert.ok(existsSync(dir), "starters/tool exists");
  for (const file of [
    ".vscode/settings.json",
    "404.md",
    "AGENTS.md",
    "README.md",
    "_config.remote.yml",
    "_config.yml",
    "_data/navigation.yml",
    "changelog.md",
    "docs/commands.md",
    "docs/index.md",
    "docs/install.md",
    "index.md",
    "llms-full.txt",
    "llms.txt",
    "search.json",
    "sitemap.xml",
  ]) {
    assert.ok(existsSync(join(dir, file)), `${file} exists`);
  }

  const files = readdirSync(dir);
  assert.ok(!files.includes("sourcemap.json"), "no sourcemap.json: the starter is built on classic Pages");
  assert.ok(!files.some((file) => file.endsWith(".twin.html")), "no twin HTML files");
});

test("the landing page points at the guide, the reference, and its own install", () => {
  const index = frontMatter("index.md");
  assert.equal(index.layout, "home");
  assert.equal(index.variant, "landing");
  assert.equal(index.cta_url, "/docs/install/");
  assert.ok(index.features.length >= 3, "at least three feature cards");
  for (const feature of index.features) assert.ok(feature.url.startsWith("/"), `${feature.title} links`);
});

test("every documentation page has a permalink the sidebar uses", () => {
  const pages = { "docs/index.md": "/docs/", "docs/install.md": "/docs/install/", "docs/commands.md": "/docs/commands/" };
  const urls = new Set(["/", "/changelog/"]);
  for (const [file, url] of Object.entries(pages)) {
    const data = frontMatter(file);
    assert.equal(data.layout, "doc", file);
    assert.equal(data.permalink, url, file);
    urls.add(data.permalink);
  }
  assert.equal(frontMatter("changelog.md").layout, "changelog");
  assert.equal(frontMatter("changelog.md").permalink, "/changelog/");

  const navigation = parse(readFileSync(join(dir, "_data/navigation.yml"), "utf8"));
  const sidebar = navigation.docs.flatMap((group) => group.children ?? []);
  assert.ok(sidebar.length >= 3, "the sidebar lists the guide");
  for (const item of [...navigation.main, ...sidebar]) {
    assert.ok(urls.has(item.url), `${item.title} points at a page (${item.url})`);
  }
});

test("the guide agent file stays out of the built site and the README notes the missing layout", () => {
  assert.equal(frontMatter("AGENTS.md").published, false);
  assert.match(readFileSync(join(dir, "README.md"), "utf8"), /no CLI reference layout/);
});
