import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { bundleAvailable, root } from "../theme/build.mjs";
import { validateSourcemap } from "../theme/sourcemap.mjs";
import { generateSourcemap, main } from "./run.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to run the source map with the GitHub Pages gem";
const fixture = join(root, "tools/theme/fixtures/sourcemap-site");
const work = mkdtempSync(join(tmpdir(), "slipway-sourcemap-"));
after(() => rmSync(work, { recursive: true, force: true }));

function jekyll(source, dest, env = {}) {
  const result = spawnSync("bundle", ["exec", "jekyll", "build", "--source", source, "--destination", dest, "--baseurl", ""], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PAGES_REPO_NWO: "arminazimi/slipway", LANG: "en_US.UTF-8", LC_ALL: "en_US.UTF-8", ...env },
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  return dest;
}

const page = (map, url) => map.pages.find((p) => p.url === url);
let cached;
const generated = () => (cached ??= generateSourcemap(fixture));

test("headings get exact lines and ids: inline code, apostrophe, ZWNJ, setext, duplicate, # in a fence", { skip }, () => {
  const doc = page(JSON.parse(generated()), "/docs/headings.html");
  assert.equal(doc.source, "_docs/headings.md");
  assert.deepEqual(doc.sections, [
    { id: "install-npm-packages", level: 1, line: 5, text: "Install npm packages" },
    { id: "whats-new", level: 2, line: 9, text: "What’s new?" },
    { id: "راستبهچپ-و-zwnj", level: 2, line: 11, text: "راست‌به‌چپ و ZWNJ" },
    { id: "setext-heading", level: 2, line: 18, text: "Setext heading" },
    { id: "install-npm-packages-1", level: 2, line: 21, text: "Install npm packages" },
  ]);
  assert.deepEqual(doc.links, [
    { href: "https://example.com/guide", line: 7 },
    { href: "/raw/", line: 23 },
  ]);
});

test("a broken link in a post maps to its line, inside a list and after the front matter", { skip }, () => {
  const map = JSON.parse(generated());
  assert.deepEqual(page(map, "/2026/10/20/broken-link.html"), {
    url: "/2026/10/20/broken-link.html",
    source: "_posts/2026-10-20-broken-link.md",
    sections: [],
    links: [{ href: "../missing.md", line: 8 }],
  });
  // A five-line front matter with a folded value.
  assert.deepEqual(page(map, "/about/").sections, [{ id: "about-us", level: 2, line: 10, text: "About us" }]);
  assert.deepEqual(page(map, "/about/").links, [{ href: "/docs/headings.html", line: 8 }]);
});

test("the map validates and lists only Markdown sources", { skip }, () => {
  const map = JSON.parse(generated());
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  assert.deepEqual(map.pages.map((p) => p.source).sort(), ["_docs/headings.md", "_posts/2026-10-20-broken-link.md", "about.md"]);
});

test("section ids match the HTML the GitHub Pages gem builds", { skip }, () => {
  const out = jekyll(fixture, join(work, "pages"));
  for (const { url, sections } of JSON.parse(generated()).pages) {
    const file = url.endsWith("/") ? `${url}index.html` : url;
    const ids = new Set([...readFileSync(join(out, file), "utf8").matchAll(/<h[1-6][^>]*\sid="([^"]*)"/g)].map((m) => m[1]));
    for (const { id } of sections) assert.ok(ids.has(id), `${url} has no heading with id ${id}`);
  }
});

test("in Actions mode the plugin writes the same map at build and replaces the level 0 stub", { skip }, () => {
  const site = join(work, "actions-site");
  cpSync(fixture, site, { recursive: true });
  cpSync(join(root, "_plugins"), join(site, "_plugins"), { recursive: true });
  writeFileSync(join(site, "sourcemap.json"), '---\nlayout: null\n---\n{ "stub": true }\n');
  // Without the GitHub Pages gem's overrides, as in an Actions build: not safe, _plugins loaded.
  const out = jekyll(site, join(work, "actions"), { JEKYLL_NO_BUNDLER_REQUIRE: "1" });
  assert.equal(readFileSync(join(out, "sourcemap.json"), "utf8"), generated());
});

test("npm run sourcemap writes the map and --check fails when it is missing or stale", { skip }, () => {
  const site = join(work, "classic-site");
  cpSync(fixture, site, { recursive: true });
  const exitCode = process.exitCode;
  const log = console.log;
  const error = console.error;
  console.log = console.error = () => {};
  try {
    main([site, "--check"]);
    assert.equal(process.exitCode, 1);
    process.exitCode = undefined;
    main([site]);
    assert.equal(readFileSync(join(site, "sourcemap.json"), "utf8"), generated());
    main([site, "--check"]);
    assert.equal(process.exitCode, undefined);
    writeFileSync(join(site, "about.md"), `${readFileSync(join(site, "about.md"), "utf8")}\n## Added later\n`);
    main([site, "--check"]);
    assert.equal(process.exitCode, 1);
  } finally {
    console.log = log;
    console.error = error;
    process.exitCode = exitCode;
  }
});
