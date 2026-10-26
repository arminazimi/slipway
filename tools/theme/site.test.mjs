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

  const indexHtml = readFileSync(join(out, "index.html"), "utf8");

  // Find all internal links starting with /
  const matches = [...indexHtml.matchAll(/href="(\/[^"]*)"/g)];
  assert.ok(matches.length > 0, "should have some internal links");

  for (const match of matches) {
    let urlPath = match[1];
    if (urlPath === "/") continue;

    // Convert /install/ to /install/index.html
    let filePath = urlPath.endsWith("/") ? urlPath + "index.html" : urlPath;
    if (!filePath.endsWith(".html") && !filePath.endsWith(".xml") && !filePath.endsWith(".txt") && !filePath.endsWith(".json")) {
      // It's a directory link without trailing slash, e.g. /install
      filePath = filePath + "/index.html";
    }

    const diskPath = join(out, filePath);
    assert.ok(existsSync(diskPath), `Link to ${urlPath} points to a page that does not exist at ${diskPath}`);
  }
});
