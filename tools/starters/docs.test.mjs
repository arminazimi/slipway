import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { validateConfig } from "../theme/config.mjs";
import { frontMatter } from "../theme/front-matter.mjs";
import { root } from "../theme/tokens.mjs";

const dir = join(root, "starters/docs");
const read = (path) => readFileSync(join(dir, path), "utf8");
const front = (path) => parse(frontMatter(read(path)) ?? "");
const body = (path) => read(path).replace(/^---\n[\s\S]*?\n---\n?/, "");
const files = readdirSync(dir, { recursive: true });
const pages = files.filter((file) => file.endsWith(".md") && !["AGENTS.md", "README.md"].includes(file));
const versioned = pages.filter((file) => /^v[12]\//.test(file));
const urlOf = (file) => front(file).permalink ?? (file === "index.md" ? "/" : `/${file.replace(/\.md$/, ".html")}`);
const navigation = parse(read("_data/navigation.yml"));
const sidebar = navigation.docs.flatMap((group) => group.children);

test("the docs starter has the expected files", () => {
  assert.ok(existsSync(dir), "starters/docs exists");
  for (const file of ["index.md", "v2/index.md", "v2/install.md", "v2/cli.md", "v1/index.md", "v1/install.md", "v1/cli.md", "_config.yml", "_data/navigation.yml", "AGENTS.md", "README.md", ".vscode/settings.json", "404.md", "search.json", "sitemap.xml", "llms.txt", "llms-full.txt"]) {
    assert.ok(existsSync(join(dir, file)), `${file} exists`);
  }
  assert.ok(!files.includes("sourcemap.json"), "no sourcemap.json");
  assert.ok(!files.some((file) => file.endsWith(".twin.html")), "no twin HTML files");
});

test("the config validates", () => {
  const config = parse(read("_config.yml"));
  assert.equal(config.lang, "en");
  const { ok, errors } = validateConfig(config);
  assert.ok(ok, errors.join("\n"));
});

test("every header and sidebar link resolves to a page", () => {
  const urls = new Set(pages.map(urlOf));
  assert.deepEqual(navigation.main.map((item) => item.url), ["/v2/", "/v1/"]);
  for (const item of navigation.main) assert.ok(urls.has(item.url), `main ${item.url} resolves to a page`);
  for (const item of sidebar) assert.ok(urls.has(item.url), `docs ${item.url} resolves to a page`);
});

test("the sidebar groups both versions and lists every docs page once", () => {
  assert.equal(navigation.docs.length, 2);
  assert.equal(navigation.docs[0].title, "Version 2 (latest)");
  assert.equal(navigation.docs[1].title, "Version 1 (legacy)");
  assert.deepEqual(navigation.docs[0].children.map((item) => item.title), ["Overview", "Install", "Commands"]);
  assert.deepEqual(navigation.docs[1].children.map((item) => item.title), ["Overview", "Install", "Commands"]);

  for (const file of versioned) {
    const url = urlOf(file);
    assert.equal(sidebar.filter((item) => item.url === url).length, 1, `${url} appears once in the sidebar`);
  }
  assert.equal(sidebar.length, versioned.length);
});

test("both versions cover the same pages", () => {
  const names = (version) => versioned.filter((file) => file.startsWith(`${version}/`)).map((file) => file.slice(version.length + 1)).sort();
  assert.deepEqual(names("v1"), ["cli.md", "index.md", "install.md"]);
  assert.deepEqual(names("v1"), names("v2"));
});

test("every docs page uses the doc layout under its own prefix", () => {
  assert.equal(front("index.md").layout, "home");
  for (const file of versioned) {
    const data = front(file);
    assert.equal(data.layout, "doc", `${file} uses the doc layout`);
    assert.ok(data.description, `${file} has a description`);
    assert.ok(urlOf(file).startsWith(`/${file.split("/")[0]}/`), `${file} is served under its version prefix`);
  }
});

test("legacy pages say they are unmaintained and link to version 2", () => {
  for (const file of versioned.filter((file) => file.startsWith("v1/"))) {
    const text = body(file);
    assert.match(text, /no longer maintained/, `${file} carries the legacy note`);
    assert.match(text, /\(\/v2\/\)/, `${file} links to the version 2 guide`);
  }
});

test("the agent guide stays unpublished", () => {
  assert.match(frontMatter(read("AGENTS.md")), /^published: false$/m);
});
