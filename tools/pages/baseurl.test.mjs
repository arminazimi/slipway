// The Pages deploy serves Slipway's own site under /slipway/, so every URL the theme writes must carry
// the base URL Pages reports. This test builds the site the way the workflow does and fails when a
// local link or asset drops it. Markdown that links to a root path on purpose is the author's, not the
// theme's; the check reads everything outside <main>.
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "../theme/build.mjs";
import { root } from "../theme/tokens.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const base = "/slipway";

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? htmlFiles(path) : path.endsWith(".html") ? [path] : [];
  });

/** The local `href` and `src` values outside the page body, where the theme, not the author, writes them. */
function themeReferences(html) {
  const chrome = html.replace(/<main[\s\S]*?<\/main>/g, "");
  return [...chrome.matchAll(/\b(?:href|src)="([^"]*)"/g)]
    .map((match) => match[1])
    .filter((value) => value.startsWith("/") && !value.startsWith("//"));
}

const under = (value, prefix) => value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}#`) || value.startsWith(`${prefix}?`);

test("the deployed site keeps the Pages base URL on every local link and asset", { skip }, () => {
  const work = mkdtempSync(join(tmpdir(), "slipway-baseurl-"));
  try {
    const site = buildExample("gem", join(work, "site"), join(root, "site"), { baseurl: base });
    const spec = buildExample("gem", join(work, "spec"), join(root, "spec/docs-site"), { baseurl: `${base}/spec` });

    for (const [dir, prefix] of [[site, base], [spec, `${base}/spec`]]) {
      const pages = htmlFiles(dir);
      assert.ok(pages.length > 0, `${dir} built no pages`);
      for (const page of pages) {
        for (const value of themeReferences(readFileSync(page, "utf8"))) {
          assert.ok(under(value, prefix), `${page.slice(dir.length)} links ${value}, outside ${prefix}`);
        }
      }
    }

    const home = readFileSync(join(site, "index.html"), "utf8");
    assert.match(home, /href="\/slipway\/assets\/css\/slipway\.css"/);
    assert.ok(existsSync(join(site, "assets/css/slipway.css")));
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
