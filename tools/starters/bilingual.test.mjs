import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { validateConfig } from "../theme/config.mjs";
import { frontMatter } from "../theme/front-matter.mjs";
import { root } from "../theme/tokens.mjs";

const dir = join(root, "starters/bilingual");
const read = (path) => readFileSync(join(dir, path), "utf8");
const front = (path) => parse(frontMatter(read(path)) ?? "");
const files = readdirSync(dir, { recursive: true });
const pages = files.filter((file) => file.endsWith(".md") && !["AGENTS.md", "README.md"].includes(file));
const translated = pages.filter((file) => front(file).translation_key);

function urlOf(file, data) {
  if (data.permalink) return data.permalink;
  return file === "index.md" ? "/" : `/${file.replace(/\.md$/, ".html")}`;
}

test("the bilingual starter has the expected files", () => {
  assert.ok(existsSync(dir), "starters/bilingual exists");
  for (const file of ["index.md", "fa/index.md", "about.md", "fa/about.md", "guide.md", "fa/guide.md", "_config.yml", "_data/navigation.yml", "AGENTS.md", "README.md", ".vscode/settings.json", "404.md", "search.json", "fa/search.json", "sitemap.xml", "llms.txt", "llms-full.txt"]) {
    assert.ok(existsSync(join(dir, file)), `${file} exists`);
  }
  assert.ok(!files.includes("sourcemap.json"), "no sourcemap.json");
  assert.ok(!files.some((file) => file.endsWith(".twin.html")), "no twin HTML files");
});

test("the config declares English and Persian and validates", () => {
  const config = parse(read("_config.yml"));
  assert.deepEqual(config.slipway.languages, [
    { code: "en", name: "English", prefix: "" },
    { code: "fa", name: "فارسی", prefix: "/fa" },
  ]);
  const { ok, errors } = validateConfig(config);
  assert.ok(ok, errors.join("\n"));
});

test("every page is translated into both languages", () => {
  const keys = [...new Set(translated.map((file) => front(file).translation_key))].sort();
  assert.deepEqual(keys, ["about", "guide", "home"]);

  for (const key of keys) {
    const copies = translated.filter((file) => front(file).translation_key === key);
    assert.deepEqual(copies.map((file) => front(file).lang).sort(), ["en", "fa"], `${key} has an English and a Persian copy`);

    const en = copies.find((file) => front(file).lang === "en");
    const fa = copies.find((file) => front(file).lang === "fa");
    assert.ok(!en.startsWith("fa/"), `${en} is the English copy`);
    assert.equal(urlOf(en, front(en)).startsWith("/fa/"), false, `${en} is outside /fa/`);
    assert.equal(fa.startsWith("fa/"), true, `${fa} sits under fa/`);
    assert.equal(urlOf(fa, front(fa)).startsWith("/fa/"), true, `${fa} is served under /fa/`);
    assert.equal(front(fa).lang, "fa");
  }
});

test("every Persian page has an English original and the other way around", () => {
  for (const file of pages) {
    const data = front(file);
    if (!data.lang) continue;
    assert.equal(data.lang, file.startsWith("fa/") ? "fa" : "en", `${file} lang matches its folder`);
    assert.ok(data.translation_key, `${file} has a translation_key`);
  }
});

test("both menus point at the same pages", () => {
  const navigation = parse(read("_data/navigation.yml"));
  assert.equal(navigation.main.length, navigation.main_fa.length, "the menus have the same length");
  const byUrl = new Map(translated.map((file) => [urlOf(file, front(file)), front(file)]));

  navigation.main.forEach((item, index) => {
    const en = byUrl.get(item.url);
    const fa = byUrl.get(navigation.main_fa[index].url);
    assert.ok(en, `main ${item.url} resolves to a page`);
    assert.ok(fa, `main_fa ${navigation.main_fa[index].url} resolves to a page`);
    assert.equal(en.lang, "en");
    assert.equal(fa.lang, "fa");
    assert.equal(en.translation_key, fa.translation_key, `${item.url} and its Persian copy share translation_key`);
  });
});

test("each language has a search index and the agent guide stays unpublished", () => {
  assert.equal(front("search.json").lang, "en");
  assert.equal(front("search.json").permalink, "/search.json");
  assert.equal(front("fa/search.json").lang, "fa");
  assert.equal(front("fa/search.json").permalink, "/fa/search.json");
  assert.match(frontMatter(read("AGENTS.md")), /^published: false$/m);
});
