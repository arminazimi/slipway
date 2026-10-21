import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { validateExampleNavigation, validateNavigation } from "./navigation.mjs";
import { readFileSync } from "node:fs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("links, groups with children, and per-language lists are accepted", () => {
  const data = {
    main: [{ title: "Docs", url: "/docs/" }, { title: "Source", url: "https://github.com/arminazimi/slipway" }],
    main_fa: [{ title: "خانه", url: "/fa/" }],
    docs: [{ title: "Start", children: [{ title: "Intro", url: "/docs/" }] }, { title: "About", url: "/about/" }],
  };
  assert.equal(validateNavigation(data).ok, true);
});

test("a link without a url, an empty group, nested groups, and unsafe urls are rejected", () => {
  const bad = [
    { main: [{ title: "Docs" }] },
    { docs: [{ title: "Start", children: [] }] },
    { docs: [{ title: "Start", children: [{ title: "Deep", children: [{ title: "x", url: "/x/" }] }] }] },
    { main: [{ title: "Bad", url: "javascript:alert(1)" }] },
    { main: [{ title: "Bad", url: "http://example.com" }] },
    { menu: [] },
    { main_english: [] },
  ];
  for (const data of bad) assert.equal(validateNavigation(data).ok, false, JSON.stringify(data));
});

test("the example navigation passes, and a broken file is reported with its path", () => {
  assert.deepEqual(validateExampleNavigation(), []);
  const dir = mkdtempSync(join(tmpdir(), "slipway-nav-"));
  mkdirSync(join(dir, "site/_data"), { recursive: true });
  writeFileSync(join(dir, "site/_data/navigation.yml"), "main:\n  - title: Docs\n");
  const problems = validateExampleNavigation(dir);
  assert.equal(problems.length > 0, true);
  assert.match(problems[0], /^examples\/site\/_data\/navigation\.yml: /);
});

test("the built header uses the list of the page language, and the sidebar nests groups", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-nav-site"));
  const html = (p) => readFileSync(join(out, p), "utf8");
  assert.match(html("fa/index.html"), /<li><a href="\/fa\/"[^>]*>خانه<\/a><\/li>/);
  assert.doesNotMatch(html("fa/index.html"), />Docs<\/a>/);
  assert.match(html("de/index.html"), />Start<\/a>/);
  assert.match(html("docs/layouts/index.html"), /<li><a href="\/docs\/"[^>]*aria-current="page"[^>]*>Docs<\/a>/);
  const tokens = html("docs/tokens/index.html");
  assert.match(tokens, /class="sl-doc-group">Reference/);
  assert.match(tokens, /rel="prev" href="\/docs\/layouts\/"/);
  assert.doesNotMatch(tokens, /rel="next"/);
});
