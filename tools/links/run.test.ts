// Tests for the internal links and anchors gate (quality.links, issue #1053). The real fixtures must pass; a copy
// of a built fixture with a planted broken page link and a planted broken anchor must fail, and so must a broken
// redirect. The helpers are tested directly so a quiet false negative is not possible.
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { builtSite, FIXTURES, type FixtureName } from "../fixture-build/build.ts";
import {
  anchorsOf,
  auditSite,
  checkLink,
  decodeEntities,
  formatFinding,
  hasAnchor,
  hrefsOf,
  readSite,
  redirectOf,
  targetOf,
  urlOf,
} from "./run.ts";

/** Writes a small build folder, one file per key, and removes it after the test. */
async function writeSite(t: { after: (fn: () => void) => void }, files: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "slipway-links-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const [path, text] of Object.entries(files)) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), text);
  }
  return dir;
}

/** Copies a built fixture, so a test can plant a broken link without editing `fixtures/`. */
async function copyFixture(t: { after: (fn: () => void) => void }, name: FixtureName): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "slipway-links-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp(await builtSite(name), dir, { recursive: true });
  return dir;
}

/** Appends HTML to a built page, before its closing body tag. */
async function appendToPage(dir: string, page: string, html: string): Promise<void> {
  const file = join(dir, page);
  const before = await readFile(file, "utf8");
  assert.ok(before.includes("</body>"), `${page} has a closing body tag`);
  await writeFile(file, before.replace("</body>", `${html}</body>`));
}

test("both fixtures have no broken internal link or anchor", async () => {
  for (const name of FIXTURES) {
    const report = await auditSite(await builtSite(name));
    assert.deepEqual(
      report.findings.map((finding) => formatFinding(name, finding)),
      [],
      `${name} must have no broken links`,
    );
    assert.ok(report.pages > 0, `${name} has pages`);
    assert.ok(report.links > 0, `${name} has internal links`);
  }
});

test("a planted missing page and missing anchor fail", async (t) => {
  const dir = await copyFixture(t, "docs-site");
  await appendToPage(
    dir,
    "index.html",
    '<a href="/definitely-missing-page/">Missing page</a><a href="#definitely-missing-anchor">Missing anchor</a>',
  );

  const report = await auditSite(dir);
  assert.deepEqual(
    report.findings.map((finding) => `${finding.page} -> ${finding.href}`),
    ["index.html -> /definitely-missing-page/", "index.html -> #definitely-missing-anchor"],
  );
  assert.equal(report.findings[0]?.target, "/definitely-missing-page/");
  assert.match(report.findings[0]?.message ?? "", /names no file in the build/);
  assert.equal(report.findings[1]?.target, "/");
  assert.match(report.findings[1]?.message ?? "", /names no anchor on index\.html/);
});

test("a redirect page is a valid target and its anchor is followed", async (t) => {
  const dir = await writeSite(t, {
    "index.html": [
      '<a href="/new/#part">direct</a>',
      '<a href="/moved/#part">redirected anchor</a>',
      '<a href="/moved/">redirected page</a>',
      '<a href="/elsewhere/#anything">external redirect</a>',
      '<a href="https://example.com/#x">external</a>',
      '<a href="mailto:docs@example.com">mail</a>',
      '<a href="/broken/#part">broken redirect</a>',
    ].join(""),
    "new/index.html": '<h2 id="part">Part</h2>',
    "moved/index.html": '<meta http-equiv="refresh" content="0; url=/new/#part">',
    "elsewhere/index.html": '<meta http-equiv="refresh" content="0; url=https://example.com/#x">',
    "broken/index.html": '<meta http-equiv="refresh" content="0; url=/new/">',
  });

  const report = await auditSite(dir);
  assert.deepEqual(report.findings.map((finding) => finding.href), ["/broken/#part"]);
  assert.match(report.findings[0]?.message ?? "", /redirects to \/new\/ without the anchor #part/);
});

test("targetOf strips the site base and skips URLs outside it", async (t) => {
  const dir = await writeSite(t, {
    ".slipway/manifest.json": JSON.stringify({
      version: 1,
      pages: [{ url: "/docs/", source: "index.md", title: "Home", layout: null, outputs: ["index.html"] }],
    }),
    "index.html": '<a href="/docs/new/">New</a><a href="/outside/">Outside</a><a href="new/">Relative</a>',
    "new/index.html": "<h1>New</h1>",
  });

  const site = await readSite(dir);
  assert.equal(site.base, "/docs");
  assert.deepEqual(targetOf(site, "index.html", "/docs/new/"), {
    rawPath: "/docs/new/",
    path: "new/",
    anchor: "",
    absolute: true,
  });
  assert.equal(targetOf(site, "index.html", "/outside/"), undefined);
  assert.equal(targetOf(site, "index.html", "https://example.com/docs/new/"), undefined);

  const report = await auditSite(dir);
  assert.deepEqual(report.findings, []);
  assert.equal(report.links, 2, "the link outside the base and the external link are skipped");
});

test("helpers decode entities, read links, anchors, and redirects, and ignore code", () => {
  assert.equal(decodeEntities("a&amp;b&#35;c&unknown;"), "a&b#c&unknown;");
  assert.deepEqual(
    hrefsOf('<a href="/a?x=1&amp;y=2">A</a><script>const x = \'<a href="/script">\';</script><!-- <a href="/comment"> -->'),
    ["/a?x=1&y=2"],
  );

  const html = '<h2 id="part">P</h2><a name="old">O</a>';
  assert.deepEqual([...anchorsOf(html)].sort(), ["old", "part"]);
  assert.ok(hasAnchor(html, "part"));
  assert.ok(hasAnchor(html, "old"));
  assert.ok(!hasAnchor(html, "gone"));

  assert.equal(redirectOf('<meta http-equiv="refresh" content="0; url=\'/new/#part\'">'), "/new/#part");
  assert.equal(redirectOf('<meta name="description" content="not a redirect">'), undefined);
  assert.equal(urlOf("install/index.html"), "/install/");
  assert.equal(urlOf("404.html"), "/404.html");
});

test("checkLink skips external links and accepts internal ones", async (t) => {
  const dir = await writeSite(t, { "index.html": '<a href="/">Home</a><a href="https://example.com">Out</a>' });
  const site = await readSite(dir);
  assert.equal(checkLink(site, "index.html", "https://example.com"), null);
  assert.equal(checkLink(site, "index.html", "/"), undefined);
});
