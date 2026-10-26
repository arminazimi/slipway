import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import yaml from "yaml";
import { bundleAvailable, buildExample, root } from "./build.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const siteDir = join(root, "site");

test("site/ exists", () => {
  assert.ok(existsSync(siteDir), "site/ directory should exist");
});

test("site/_config.yml parses", () => {
  const configPath = join(siteDir, "_config.yml");
  assert.ok(existsSync(configPath), "site/_config.yml should exist");
  const content = readFileSync(configPath, "utf8");
  const parsed = yaml.parse(content);
  assert.ok(parsed.title, "site should have a title");
});

test("site builds with GitHub Pages gem and internal links resolve", { skip }, () => {
  const out = join(mkdtempSync(join(tmpdir(), "slipway-site-")), "_site");
  // buildExample assumes examples/ if not absolute, so we pass the absolute path to site/
  buildExample("gem", out, siteDir);

  assert.ok(existsSync(join(out, "index.html")), "index.html should be built");

  // A simple check that internal links resolve to files.
  // The home page has a link to /install/ and /spec/ in our docs.
  const indexHtml = readFileSync(join(out, "index.html"), "utf8");
  assert.match(indexHtml, /href="\/install\/"/, "index.html should link to install");
  assert.match(indexHtml, /href="\/spec\/"/, "index.html should link to spec");

  assert.ok(existsSync(join(out, "install/index.html")), "install page should be built");
  assert.ok(existsSync(join(out, "config/index.html")), "config page should be built");
  assert.ok(existsSync(join(out, "spec/index.html")), "spec page should be built");
});
