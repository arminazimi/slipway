// The theme builds the same site on the GitHub Pages gem (Jekyll 3.10) and on plain Jekyll 4.
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { test } from "node:test";
import { bundleAvailable, buildExample, gemfiles } from "./build.mjs";

const missing = Object.entries(gemfiles).filter(([, gemfile]) => !bundleAvailable(gemfile));
// CI's jekyll4 job sets SLIPWAY_REQUIRE_JEKYLL4=1, so a missing bundle fails there instead of skipping.
const skip = missing.length && process.env.SLIPWAY_REQUIRE_JEKYLL4 !== "1"
  ? `install both Jekylls: ${missing.map(([name, gemfile]) => `BUNDLE_GEMFILE=${relative(process.cwd(), gemfile)} bundle install (${name})`).join(", ")}`
  : false;

/** Every built HTML and XML file under `dir`, by path, with the generator meta and whitespace normalized. */
function pages(dir) {
  const found = {};
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.(html|xml)$/.test(entry.name)) {
        found[relative(dir, path)] = readFileSync(path, "utf8")
          .replace(/<meta name="generator"[^>]*>/g, "")
          .replace(/<generator[^>]*>[^<]*<\/generator>/g, "")
          .replace(/>\s+</g, "><")
          .replace(/\s+/g, " ")
          .trim();
      }
    }
  };
  walk(dir);
  return found;
}

test("the minimal example builds the same on Jekyll 3.10 (Pages) and Jekyll 4", { skip }, () => {
  assert.deepEqual(missing.map(([name]) => name), [], "both bundles are installed");
  const work = mkdtempSync(join(tmpdir(), "slipway-jekyll4-"));
  // The same `url` for both, so jekyll-github-metadata's guess on Pages does not differ from Jekyll 4.
  const url = join(work, "url.yml");
  writeFileSync(url, "url: https://example.org\nrepository_url: https://github.com/arminazimi/slipway\n");
  const built = Object.fromEntries(
    Object.entries(gemfiles).map(([name, gemfile]) => [
      name,
      pages(buildExample("gem", join(work, name), "minimal", { gemfile, configs: [url] })),
    ]),
  );
  assert.ok(Object.keys(built.pages).length > 10, "the site has pages to compare");
  assert.deepEqual(Object.keys(built.jekyll4).sort(), Object.keys(built.pages).sort(), "the same files are built");
  for (const path of Object.keys(built.pages)) assert.equal(built.jekyll4[path], built.pages[path], `${path} differs`);
});
