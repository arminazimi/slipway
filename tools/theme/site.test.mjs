import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
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

export function verifyInternalLinks(html, outDir) {
  const matches = [...html.matchAll(/href="([^"]+)"/g)];
  for (const match of matches) {
    const href = match[1];
    // Skip external, protocol-relative, and hash-only links
    if (href.startsWith("http") || href.startsWith("//") || href.startsWith("#") || href.startsWith("mailto:")) continue;
    // Must start with / to be an absolute internal path
    if (!href.startsWith("/")) continue;

    const url = new URL(href, "http://localhost");
    const pathname = url.pathname;
    if (pathname === "/") continue;

    // Skip if it has a file extension other than .html
    const parts = pathname.split("/");
    const lastSegment = parts[parts.length - 1];
    if (lastSegment.includes(".") && !lastSegment.endsWith(".html")) continue;

    // Convert to file path
    let filePath = pathname;
    if (filePath.endsWith("/")) {
      filePath += "index.html";
    } else if (!lastSegment.includes(".")) {
      filePath += "/index.html";
    }

    const diskPath = join(outDir, filePath);
    assert.ok(existsSync(diskPath), `Link to ${href} points to a page that does not exist at ${diskPath}`);
  }
}

test("verifyInternalLinks catches missing pages and skips non-pages", () => {
  const out = mkdtempSync(join(tmpdir(), "slipway-link-test-"));
  // Create a dummy valid page so it passes when checking valid links
  mkdirSync(join(out, "install"), { recursive: true });
  writeFileSync(join(out, "install", "index.html"), "");

  const validHtml = `
    <a href="/install/">install</a>
    <a href="/assets/fonts/font.woff2">font (should be skipped)</a>
    <a href="//google.com">google (skipped)</a>
    <a href="#section">hash (skipped)</a>
    <a href="mailto:a@b.com">mailto (skipped)</a>
  `;
  // Should not throw
  verifyInternalLinks(validHtml, out);

  const invalidHtml = `<a href="/missing/">missing</a>`;
  assert.throws(() => verifyInternalLinks(invalidHtml, out), {
    message: /points to a page that does not exist/
  });
});

test("site builds with GitHub Pages gem and internal links resolve", { skip }, () => {
  const out = join(mkdtempSync(join(tmpdir(), "slipway-site-")), "_site");
  // buildExample assumes examples/ if not absolute, so we pass the absolute path to site/
  buildExample("gem", out, siteDir);

  assert.ok(existsSync(join(out, "index.html")), "index.html should be built");

  const indexHtml = readFileSync(join(out, "index.html"), "utf8");
  verifyInternalLinks(indexHtml, out);
});
