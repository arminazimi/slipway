import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import vm from "node:vm";
import { bundleAvailable, buildExample } from "./build.mjs";
import { tmpDir } from "./tmp.mjs";
import { root } from "./tokens.mjs";

const read = (path) => readFileSync(join(root, path), "utf8");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const PAGES = 600;

/* A minimal English site with 600 ordinary doc pages plus the pages the index must leave out: one with
   `search: false`, one with `layout: none`, one non-HTML output (.xml), and one without a title. */
function writeFixture(dir) {
  mkdirSync(join(dir, "docs"), { recursive: true });
  writeFileSync(join(dir, "_config.yml"), "title: Search scale\nlang: en\ntheme: slipway-theme\npermalink: pretty\n");
  writeFileSync(join(dir, "search.json"), "---\nlayout: search-index\nlang: en\npermalink: /search.json\n---\n");
  writeFileSync(join(dir, "index.md"), "---\ntitle: Home\n---\n\nThe home page of a large documentation site.\n");
  for (let n = 1; n <= PAGES; n++) {
    writeFileSync(
      join(dir, "docs", `page-${n}.md`),
      [
        "---",
        `title: Doc page ${n}`,
        "---",
        "",
        `Doc page ${n} opens with ordinary prose about running a documentation site this large.`,
        "",
        "## Setup",
        "",
        `Page ${n} explains the setup steps in plain sentences long enough to exercise the excerpt cut.`,
        "",
        "### Advanced setup",
        "",
        `Page ${n} continues with advanced setup notes, again long enough to be cut at 300 characters.`,
        "",
        "## Operations",
        "",
        `Page ${n} ends with operations notes: backups, upgrades, and the rest of the routine work.`,
        "",
      ].join("\n"),
    );
  }
  writeFileSync(join(dir, "hidden.md"), "---\ntitle: Hidden from search\nsearch: false\n---\n\nThis page stays out of the index.\n");
  writeFileSync(join(dir, "raw.txt"), "---\ntitle: Raw text\nlayout: none\npermalink: /raw.txt\n---\n\nNot a page.\n");
  writeFileSync(join(dir, "data.xml"), "---\ntitle: Data file\npermalink: /data.xml\n---\n\n<note>not a page</note>\n");
  writeFileSync(join(dir, "untitled.md"), "---\nlayout: page\n---\n\nNo title, so no index entry.\n");
}

test("a 600-page site keeps its search index under 600 KB", { skip }, () => {
  const src = tmpDir("search-scale-site");
  writeFixture(src);
  const out = buildExample("gem", tmpDir("search-scale-out"), src);
  const raw = readFileSync(join(out, "search.json"));
  const entries = JSON.parse(raw);
  assert.equal(entries.length, PAGES + 1, "the index holds the home page and the 600 doc pages only");
  assert.ok(raw.length < 600 * 1024, `search.json is ${raw.length} bytes, want under ${600 * 1024}`);
  for (const entry of entries) {
    assert.deepEqual(Object.keys(entry), ["title", "url", "headings", "text"]);
    assert.ok(entry.text.length <= 300, `the excerpt of ${entry.url} is ${entry.text.length} characters`);
  }
  const page = entries.find((entry) => entry.url === "/docs/page-1/");
  assert.equal(page.headings, "Setup Advanced setup Operations");
  const urls = entries.map((entry) => entry.url).join("\n");
  assert.doesNotMatch(urls, /hidden|raw\.txt|data\.xml|untitled|search\.json/);
});

function element() {
  return {
    children: [],
    textContent: "",
    href: "",
    hidden: true,
    value: "",
    handlers: {},
    appendChild(child) { this.children.push(child); },
    addEventListener(type, fn) { (this.handlers[type] = this.handlers[type] || []).push(fn); },
    querySelectorAll: () => [],
  };
}

/* Runs assets/js/search.js against a stub page and returns the stubs, so the lazy fetch is observable
   without a browser. */
function fakeSite(index) {
  const input = element();
  const panel = element();
  const status = element();
  const list = element();
  const form = element();
  form.getAttribute = (name) => ({ "data-search": "/search.json", "data-none": "nothing", "data-count": "{n}" })[name];
  form.querySelector = (sel) => (sel === "input" ? input : sel === ".sl-search-panel" ? panel : sel === ".sl-search-status" ? status : list);
  const calls = { fetches: 0 };
  const context = {
    document: {
      querySelector: (sel) => (sel === "[data-search]" ? form : null),
      createElement: () => element(),
      addEventListener() {},
      body: { classList: { contains: () => false } },
    },
    location: {},
    fetch: () => { calls.fetches += 1; return Promise.resolve({ json: () => Promise.resolve(index) }); },
  };
  context.globalThis = context;
  vm.runInNewContext(read("assets/js/search.js"), context);
  return { form, input, panel, status, list, calls };
}

const drain = () => new Promise((resolve) => setImmediate(resolve));

test("the index loads on the first focus or keystroke, not while the page loads", async () => {
  const { form, input, panel, status, list, calls } = fakeSite([
    { title: "Tokens", url: "/tokens/", headings: "", text: "colors and fonts" },
  ]);
  assert.equal(calls.fetches, 0, "nothing is fetched when the page loads");
  assert.equal(form.hidden, false, "the field is usable as soon as the script runs");
  input.value = "colors";
  input.handlers.input[0]();
  await drain();
  assert.equal(calls.fetches, 1, "the first keystroke fetches the index");
  assert.equal(panel.hidden, false);
  assert.equal(status.textContent, "1");
  assert.equal(list.children.length, 1);
  assert.equal(list.children[0].children[0].textContent, "Tokens");
  assert.equal(list.children[0].children[1].textContent, "colors and fonts");
  input.handlers.focus[0]();
  await drain();
  assert.equal(calls.fetches, 1, "a later focus reuses the loaded index");
});
