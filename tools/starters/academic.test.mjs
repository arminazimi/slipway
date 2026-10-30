import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { parse } from "yaml";
import { validateConfig } from "../theme/config.mjs";
import { frontMatter } from "../theme/front-matter.mjs";
import { root } from "../theme/tokens.mjs";

const dir = join(root, "starters/academic");
const read = (path) => readFileSync(join(dir, path), "utf8");
const front = (path) => parse(frontMatter(read(path)) ?? "");
const body = (path) => read(path).replace(/^---\n[\s\S]*?\n---\n?/, "");
const files = readdirSync(dir, { recursive: true });
const pages = files.filter((file) => file.endsWith(".md") && !["AGENTS.md", "README.md"].includes(file));

function sections(markdown) {
  const out = [];
  for (const line of markdown.split("\n")) {
    const heading = /^## (.+)$/.exec(line);
    if (heading) out.push({ title: heading[1].trim(), lines: [] });
    else if (out.length) out.at(-1).lines.push(line);
  }
  return out;
}

const urlOf = (file) => front(file).permalink ?? (file === "index.md" ? "/" : `/${file.replace(/\.md$/, ".html")}`);
const years = (list) => sections(list).map((section) => section.title);

test("the academic starter has the expected files", () => {
  assert.ok(existsSync(dir), "starters/academic exists");
  for (const file of ["index.md", "publications.md", "talks.md", "teaching.md", "cv.md", "_config.yml", "_data/navigation.yml", "AGENTS.md", "README.md", ".vscode/settings.json", "404.md", "search.json", "sitemap.xml", "llms.txt", "llms-full.txt"]) {
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

test("every menu item resolves to a page", () => {
  const navigation = parse(read("_data/navigation.yml"));
  const urls = new Set(pages.map((file) => urlOf(file)));
  assert.deepEqual(navigation.main.map((item) => item.url), ["/", "/publications.html", "/talks.html", "/teaching.html", "/cv.html"]);
  for (const item of navigation.main) assert.ok(urls.has(item.url), `main ${item.url} resolves to a page`);
});

test("publications are grouped by year, newest first, and each entry matches its year", () => {
  const groups = sections(body("publications.md"));
  const listed = groups.map((group) => group.title);
  assert.ok(groups.length >= 3, "at least three years");
  for (const group of groups) assert.match(group.title, /^\d{4}$/);
  assert.deepEqual(listed, [...listed].sort().reverse(), "years run newest first");

  for (const group of groups) {
    const entries = group.lines.filter((line) => /^\d+\. /.test(line));
    assert.ok(entries.length >= 1, `${group.title} has a publication`);
    for (const entry of entries) {
      assert.ok(entry.startsWith(`${entries.indexOf(entry) + 1}. `), `${group.title} entries are numbered in order`);
      assert.ok(entry.includes(`(${group.title})`), `${entry} is dated ${group.title}`);
    }
  }
});

test("talks are grouped by year, newest first, and name a venue", () => {
  const groups = sections(body("talks.md"));
  const listed = groups.map((group) => group.title);
  assert.ok(groups.length >= 2, "at least two years");
  assert.deepEqual(listed, [...listed].sort().reverse(), "years run newest first");

  for (const group of groups) {
    assert.match(group.title, /^\d{4}$/);
    const entries = group.lines.filter((line) => line.startsWith("- **"));
    assert.ok(entries.length >= 1, `${group.title} has a talk`);
    for (const entry of entries) {
      assert.ok(entry.includes(group.title), `${entry} is dated ${group.title}`);
      assert.ok(entry.includes("."), `${entry} names a venue`);
    }
  }
});

test("every course has a semester and a description", () => {
  const courses = sections(body("teaching.md"));
  assert.ok(courses.length >= 3, "at least three courses");
  for (const course of courses) {
    const text = course.lines.join("\n");
    assert.match(text, /^\*Semester:\* \w+ \d{4}/m, `${course.title} has a semester`);
    assert.ok(text.replace(/^\s*\n/, "").length > 100, `${course.title} has a description`);
  }
});

test("the CV has its four sections with entries", () => {
  const groups = sections(body("cv.md"));
  assert.deepEqual(groups.map((group) => group.title), ["Education", "Appointments", "Awards", "Service"]);
  for (const group of groups) {
    assert.ok(group.lines.some((line) => line.startsWith("- **")), `${group.title} has an entry`);
  }
});

test("the agent guide stays unpublished", () => {
  assert.match(frontMatter(read("AGENTS.md")), /^published: false$/m);
});
