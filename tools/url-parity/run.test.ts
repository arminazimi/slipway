import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import {
  audit,
  compare,
  normalizeUrl,
  oldUrls,
  parseSitemap,
  readBuild,
  redirectTargets,
} from "./run.ts";

/** The script's own path, so a test can run the real command line. */
const runFile = fileURLToPath(new URL("./run.ts", import.meta.url));

/** Writes a file, creating its folder. */
async function write(path: string, contents: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, contents);
}

/** A temporary folder that is removed after the test. */
async function tempDir(t: { after: (fn: () => void | Promise<void>) => void }): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "url-parity-test-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  return dir;
}

/** A minimal HTML page, with the canonical link every generated page carries. */
function page(title: string): string {
  return [
    "<!doctype html>",
    `<html lang="en"><head><title>${title}</title><link rel="canonical" href="https://example.com/"></head>`,
    `<body><h1>${title}</h1></body></html>`,
    "",
  ].join("\n");
}

/** A redirect page with a meta refresh and a canonical link to the same target. */
function redirectPage(target: string): string {
  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8"><title>Redirecting</title>',
    `<link rel="canonical" href="${target}">`,
    `<meta http-equiv="refresh" content="0; url=${target}">`,
    "</head><body>",
    `<p>This page moved to <a href="${target}">${target}</a>.</p>`,
    "</body></html>",
    "",
  ].join("\n");
}

/** Escapes the characters XML reserves. */
function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

/** A valid sitemap with one `<url>` per URL. */
function sitemap(urls: readonly string[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`),
    "</urlset>",
    "",
  ].join("\n");
}

/** A build with root, folder, and file pages, an app page, a redirect, and a site file. */
async function sampleBuild(t: { after: (fn: () => void | Promise<void>) => void }): Promise<string> {
  const dir = await tempDir(t);
  await write(join(dir, "index.html"), page("Home"));
  await write(join(dir, "guide/index.html"), page("Guide"));
  await write(join(dir, "about.html"), page("About"));
  await write(join(dir, "new/index.html"), page("New"));
  await write(join(dir, "dashboard/index.html"), page("Dashboard"));
  await write(join(dir, "old/index.html"), redirectPage("https://example.com/new/"));
  await write(join(dir, "sitemap.xml"), sitemap(["https://example.com/"]));
  await write(
    join(dir, ".slipway/manifest.json"),
    `${JSON.stringify({
      version: 1,
      pages: [
        { url: "/", outputs: ["index.html", "index.md"] },
        { url: "/guide/", outputs: ["guide/index.html", "guide/index.md"] },
        { url: "/about.html", outputs: ["about.html", "about.md"] },
        { url: "/new/", outputs: ["new/index.html", "new/index.md"] },
      ],
    })}\n`,
  );
  return dir;
}

test("normalization makes trailing slash, index.html, legacy .html, query, fragment, and base agree", () => {
  assert.equal(normalizeUrl("https://example.com"), "/");
  assert.equal(normalizeUrl("https://example.com/"), "/");
  assert.equal(normalizeUrl("https://example.com/index.html"), "/");
  assert.equal(normalizeUrl("https://example.com/a"), "/a/");
  assert.equal(normalizeUrl("https://example.com/a/"), "/a/");
  assert.equal(normalizeUrl("https://example.com/a/index.html"), "/a/");
  assert.equal(normalizeUrl("https://example.com/a.html"), "/a/");
  assert.equal(normalizeUrl("https://example.com/a.html?page=2#top"), "/a/");
  assert.equal(normalizeUrl("/a"), "/a/");
  assert.equal(normalizeUrl("a/b"), "/a/b/");
  assert.equal(normalizeUrl("https://example.com/a.pdf"), "/a.pdf");
  assert.equal(normalizeUrl("https://example.com/docs/a/", { base: "/docs" }), "/a/");
  assert.equal(normalizeUrl("https://example.com/docs", { base: "/docs" }), "/");
  assert.equal(normalizeUrl("https://example.com/docs/index.html", { base: "/docs/" }), "/");
  assert.equal(normalizeUrl("mailto:docs@example.com"), undefined);
  assert.equal(normalizeUrl("  "), undefined);
});

test("parses <loc> entries and decodes XML entities", () => {
  const parsed = parseSitemap(
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      "  <url><loc>https://example.com/a?x=1&amp;y=2</loc></url>",
      "  <url><loc> /b/ </loc><lastmod>2026-01-01</lastmod></url>",
      "</urlset>",
    ].join("\n"),
  );
  assert.equal(parsed.error, undefined);
  assert.deepEqual(parsed.urls, ["https://example.com/a?x=1&y=2", "/b/"]);
});

test("a malformed sitemap returns an error instead of throwing", () => {
  for (const xml of [
    "",
    "<html><body>not a sitemap</body></html>",
    '<urlset><url><loc>/a</loc></url>',
    '<urlset><url><loc>/a</loc></url><url><loc>/b</url></urlset>',
    "<urlset><url></url></urlset>",
    "<urlset><url><loc></loc></url></urlset>",
    '<sitemapindex><sitemap><loc>https://example.com/sitemap.xml</loc></sitemap></sitemapindex>',
  ]) {
    const parsed = parseSitemap(xml);
    assert.equal(parsed.urls.length, 0, xml);
    assert.equal(typeof parsed.error, "string", xml);
  }
});

test("redirectTargets needs a meta refresh, then also reports the canonical target", () => {
  assert.deepEqual(redirectTargets(redirectPage("/new/")), ["/new/"]);
  assert.equal(redirectTargets(page("Not a redirect")), undefined);
  assert.deepEqual(
    redirectTargets(
      '<html><head><meta http-equiv="refresh" content="0; url=/one/"><link rel="canonical" href="https://example.com/two/"></head></html>',
    ),
    ["/one/", "https://example.com/two/"],
  );
});

test("readBuild counts manifest pages and redirect pages, not app pages or site files", async (t) => {
  const build = await readBuild(await sampleBuild(t));
  assert.equal(build.base, "");
  assert.deepEqual([...build.pages].sort(), ["/", "/about/", "/guide/", "/new/"]);
  assert.equal(build.pages.has("/dashboard/"), false);
  assert.equal(build.pages.has("/sitemap.xml"), false);
  assert.deepEqual(build.redirects.get("/old/")?.targets.map((target) => target.path), ["/new/"]);
});

test("an aligned old sitemap passes, including every spelling of one URL", async (t) => {
  const build = await readBuild(await sampleBuild(t));
  const entries = oldUrls(
    [
      "https://example.com/",
      "https://example.com/guide",
      "https://example.com/guide/",
      "https://example.com/guide/index.html",
      "https://example.com/guide.html",
    ],
    "",
  );
  assert.deepEqual(compare(entries, build), { checked: 2, covered: 2, redirected: 0, missing: [] });
});

test("a missing old URL is a finding with the original URL in it", async (t) => {
  const build = await readBuild(await sampleBuild(t));
  const report = compare(oldUrls(["https://example.com/missing.html"], ""), build);
  assert.deepEqual(report, {
    checked: 1,
    covered: 0,
    redirected: 0,
    missing: [{ old: "https://example.com/missing.html", normalized: "/missing/" }],
  });
});

test("a redirect covers its own URL and its target is covered for reporting", async (t) => {
  const build = await readBuild(await sampleBuild(t));
  const report = compare(oldUrls(["https://example.com/old", "https://example.com/new/"], ""), build);
  assert.deepEqual(report, { checked: 2, covered: 1, redirected: 1, missing: [] });
});

test("the base derived from the manifest is stripped from old URLs and redirect targets", async (t) => {
  const dir = await tempDir(t);
  await write(join(dir, "index.html"), page("Home"));
  await write(join(dir, "guide/index.html"), page("Guide"));
  await write(join(dir, "about.html"), page("About"));
  await write(join(dir, "old/index.html"), redirectPage("https://example.com/docs/guide/"));
  await write(
    join(dir, ".slipway/manifest.json"),
    `${JSON.stringify({
      version: 1,
      pages: [
        { url: "/docs/", outputs: ["index.html", "index.md"] },
        { url: "/docs/guide/", outputs: ["guide/index.html", "guide/index.md"] },
        { url: "/docs/about.html", outputs: ["about.html", "about.md"] },
      ],
    })}\n`,
  );

  const build = await readBuild(dir);
  assert.equal(build.base, "/docs");
  const report = compare(
    oldUrls(["https://example.com/docs/guide/", "https://example.com/docs/about.html", "https://example.com/docs/old/"], "/docs"),
    build,
  );
  assert.deepEqual(report, { checked: 3, covered: 2, redirected: 1, missing: [] });
});

test("the old sitemap can be a local file", async (t) => {
  const dir = await sampleBuild(t);
  const old = join(await tempDir(t), "sitemap.xml");
  await write(old, sitemap(["https://example.com/", "https://example.com/guide/"]));

  const result = await audit({ old, new: dir });
  assert.equal(result.error, undefined);
  assert.deepEqual(result.report, { checked: 2, covered: 2, redirected: 0, missing: [] });
});

test("the old sitemap can be an http(s) URL", async (t) => {
  const dir = await sampleBuild(t);
  const xml = sitemap(["https://example.com/", "https://example.com/guide/"]);
  const server = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/xml; charset=utf-8" });
    response.end(xml);
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(() => new Promise<void>((resolve) => server.close(() => resolve())));

  const address = server.address();
  assert.ok(address !== null && typeof address === "object");
  const result = await audit({ old: `http://127.0.0.1:${address.port}/sitemap.xml`, new: dir });
  assert.equal(result.error, undefined);
  assert.deepEqual(result.report, { checked: 2, covered: 2, redirected: 0, missing: [] });
});

test("a sitemap parse error is returned by audit, not thrown", async (t) => {
  const dir = await sampleBuild(t);
  const old = join(await tempDir(t), "broken.xml");
  await write(old, "<urlset><url><loc>/a</loc></url>");

  const result = await audit({ old, new: dir });
  assert.equal(result.report, undefined);
  assert.match(result.error ?? "", /malformed sitemap/);
});

test("the report and the old URL list are deterministic whatever the sitemap order", async (t) => {
  const build = await readBuild(await sampleBuild(t));
  const first = compare(oldUrls(["https://example.com/z", "https://example.com/a", "https://example.com/a/"], ""), build);
  const second = compare(oldUrls(["https://example.com/a/", "https://example.com/z", "https://example.com/a"], ""), build);
  assert.deepEqual(first, second);
  assert.deepEqual(first.missing.map((item) => item.normalized), ["/a/", "/z/"]);
});

test("the command line prints each missing URL and exits 1", async (t) => {
  const dir = await sampleBuild(t);
  const old = join(await tempDir(t), "sitemap.xml");
  await write(old, sitemap(["https://example.com/missing.html"]));

  const result = spawnSync(process.execPath, [runFile, "--old", old, "--new", dir], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /https:\/\/example\.com\/missing\.html -> \(missing\)/);
  assert.match(result.stdout, /checked 1, covered 0, redirected 0, missing 1/);
});

test("the command line exits 1 and reports a malformed sitemap", async (t) => {
  const dir = await sampleBuild(t);
  const old = join(await tempDir(t), "broken.xml");
  await write(old, "<urlset><url><loc>/a</loc></url>");

  const result = spawnSync(process.execPath, [runFile, "--old", old, "--new", dir], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /malformed sitemap/);
});

test("the command line prints OK and exits 0 when every old URL is covered", async (t) => {
  const dir = await sampleBuild(t);
  const old = join(await tempDir(t), "sitemap.xml");
  await write(old, sitemap(["https://example.com/", "https://example.com/guide"]));

  const result = spawnSync(process.execPath, [runFile, old, dir], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^OK: url-parity /m);
  assert.match(result.stdout, /missing 0/);
});

test("the no-argument run compares examples/product-docs with its own sitemap", () => {
  const result = spawnSync(process.execPath, [runFile], { encoding: "utf8", timeout: 120_000 });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /^OK: url-parity examples\/product-docs/m);
  assert.match(result.stdout, /missing 0/);
});
