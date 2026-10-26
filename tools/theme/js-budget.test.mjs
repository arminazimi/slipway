import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "./build.mjs";
import { budgetBytes, pageProblems, scriptSizes, totalBytes } from "./js-budget.mjs";
import { root } from "./tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

test("the budget is 10 KB of raw bytes", () => {
  assert.equal(budgetBytes, 10240);
});

test("the scripts the theme ships fit the budget", () => {
  const sizes = scriptSizes();
  assert.ok(sizes.length >= 3);
  assert.ok(totalBytes(sizes) <= budgetBytes, sizes.map((f) => `${f.name} ${f.bytes}`).join(", "));
});

test("every script in the folder counts, including ones added later", () => {
  const dir = mkdtempSync(join(tmpdir(), "slipway-js-"));
  writeFileSync(join(dir, "a.js"), "x".repeat(6000));
  writeFileSync(join(dir, "b.js"), "x".repeat(5000));
  writeFileSync(join(dir, "notes.txt"), "x".repeat(9000));
  assert.equal(totalBytes(scriptSizes(dir)), 11000);
  assert.ok(totalBytes(scriptSizes(dir)) > budgetBytes);
});

test("pageProblems flags blocking scripts, visible controls, and noscript", () => {
  assert.deepEqual(pageProblems('<script src="/a.js" defer></script><form data-search="/s.json" hidden></form><button data-theme-toggle hidden>'), []);
  assert.equal(pageProblems('<script src="/a.js"></script>').length, 1);
  assert.deepEqual(pageProblems('<script type="application/ld+json">{}</script>'), []);
  assert.equal(pageProblems('<form data-search="/s.json"></form>').length, 1);
  assert.equal(pageProblems("<button data-theme-toggle>Theme</button>").length, 1);
  assert.equal(pageProblems("<noscript>Enable JavaScript</noscript>").length, 1);
  assert.deepEqual(pageProblems('<script>try{var t=localStorage.getItem("slipway-theme");}catch(e){}</script>'), []);
});

test("no page of the example site needs JavaScript to be read", { skip }, () => {
  const out = buildExample("gem", join(root, ".tmp-js-site"));
  const pages = [];
  const walk = (dir) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (name.endsWith(".html")) pages.push(path);
    }
  };
  walk(out);
  assert.ok(pages.length >= 15);
  for (const page of pages) assert.deepEqual(pageProblems(readFileSync(page, "utf8"), page.slice(out.length)), []);
});
