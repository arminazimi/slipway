import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { builtSite } from "../fixture-build/build.ts";
import { audit, auditInBrowser, browser, readSite, sample, targetOf, urlOf } from "./run.ts";

/** A docs page with every part the gate checks: main, article, sidebar, table of contents, pager, and code. */
function page({ sidebar = true, article = true, toc = true, pager = true, code = "npm ci", headings = 2, tocHref = "#install-0" } = {}): string {
  const nav = sidebar
    ? '<aside class="sidebar" aria-label="Site navigation"><nav><ul><li><a href="/">Home</a></li><li><a href="/install/" aria-current="page">Install</a></li></ul></nav></aside>'
    : "";
  const sections = Array.from({ length: headings }, (_, index) => `<h2 id="install-${index}">Install ${index + 1}</h2>`).join("");
  const body = article
    ? `<article class="doc"><h1>Install</h1><div class="doc-body"><p>Beacon ships as a single binary for every platform.</p>${sections}<pre><code>${code}</code></pre></div>${pager ? '<nav class="pager"><a href="/">Previous</a><a href="/next/">Next</a></nav>' : ""}</article>`
    : "";
  const contents = toc && article && headings > 0
    ? `<aside class="aside" aria-label="On this page"><aside class="toc"><h2>On this page</h2><ul><li><a href="${tocHref}">Install</a></li></ul></aside></aside>`
    : "";
  return `<!DOCTYPE html><html lang="en"><body><a class="skip-link" href="#main">Skip to content</a><header></header><div class="layout">${nav}<main id="main">${body}</main>${contents}</div><footer></footer></body></html>`;
}

/** Writes `/index.html` and `/next/` plus whichever pages the test names, and returns the build folder. */
async function site(t: { after: (fn: () => void) => void }, pages: Record<string, string>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), "nojs-engine-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  const files = { "index.html": page({ pager: false }), "next/index.html": page({ pager: false }), "install/index.html": page(), ...pages };
  for (const [path, html] of Object.entries(files)) {
    await mkdir(dirname(join(dir, path)), { recursive: true });
    await writeFile(join(dir, path), html);
  }
  return dir;
}

test("a page with every part passes", async (t) => {
  const dir = await site(t, { "install/index.html": page() });
  assert.deepEqual(audit(await readSite(dir)), []);
});

test("a page without a sidebar fails", async (t) => {
  const dir = await site(t, { "install/index.html": page({ sidebar: false }) });
  const findings = audit(await readSite(dir));
  assert.deepEqual(findings.map((f) => `${f.page}:${f.rule}`), ["install/index.html:sidebar"]);
});

test("a page without an article fails", async (t) => {
  const dir = await site(t, { "install/index.html": page({ article: false }) });
  const findings = audit(await readSite(dir));
  assert.deepEqual(findings.map((f) => `${f.page}:${f.rule}`), ["install/index.html:article"]);
});

test("headings without a table of contents fail", async (t) => {
  const dir = await site(t, { "install/index.html": page({ toc: false }) });
  const findings = audit(await readSite(dir));
  assert.deepEqual(findings.map((f) => `${f.page}:${f.rule}`), ["install/index.html:toc"]);
});

test("an empty code block fails", async (t) => {
  const dir = await site(t, { "install/index.html": page({ code: "" }) });
  const findings = audit(await readSite(dir));
  assert.deepEqual(findings.map((f) => `${f.page}:${f.rule}`), ["install/index.html:code"]);
});

test("a table of contents link to a missing anchor fails", async (t) => {
  const dir = await site(t, { "install/index.html": page({ tocHref: "#missing" }) });
  const findings = audit(await readSite(dir));
  assert.deepEqual(findings.map((f) => `${f.page}:${f.rule}`), ["install/index.html:links"]);
  assert.match(findings[0]?.message ?? "", /#missing/);
});

test("a pager link to a missing page fails", async (t) => {
  const dir = await site(t, { "install/index.html": page().replace('<a href="/next/">Next</a>', '<a href="/gone/">Next</a>') });
  const findings = audit(await readSite(dir));
  assert.deepEqual(findings.map((f) => `${f.page}:${f.rule}`), ["install/index.html:links"]);
  assert.match(findings[0]?.message ?? "", /\/gone\//);
});

test("a page outside the docs layout is not audited", async (t) => {
  const dir = await site(t, { "dashboard/index.html": "<!doctype html><main><h1>A product's own page</h1></main>" });
  assert.deepEqual(audit(await readSite(dir)), []);
});

test("urlOf and targetOf map pages and hrefs to build paths", () => {
  assert.equal(urlOf("index.html"), "/");
  assert.equal(urlOf("install/index.html"), "/install/");
  assert.equal(urlOf("rules/hooks-001/index.html"), "/rules/hooks-001/");
  assert.deepEqual(targetOf("install/index.html", "#step"), { path: "install/index.html", anchor: "step" });
  assert.deepEqual(targetOf("install/index.html", "../reference/"), { path: "reference/", anchor: "" });
  assert.deepEqual(targetOf("install/index.html", "/quickstart/#run"), { path: "quickstart/", anchor: "run" });
  assert.equal(targetOf("index.html", "https://example.com"), undefined);
});

test("the sample covers the docs pages and stays small", async (t) => {
  const dir = await site(t, { "install/index.html": page() });
  const paths = sample(await readSite(dir));
  assert.ok(paths.includes("index.html"));
  assert.ok(paths.includes("install/index.html"));
  assert.ok(paths.length <= 8);
});

test("the engine's build of fixtures/docs-site passes", async () => {
  const findings = audit(await readSite(await builtSite("docs-site")));
  assert.deepEqual(findings, []);
});

test("a deliberately broken copy of the fixture fails", async (t) => {
  const built = await builtSite("docs-site");
  const dir = await mkdtemp(join(tmpdir(), "nojs-engine-broken-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp(built, dir, { recursive: true });
  const index = join(dir, "install/index.html");
  const html = await (await import("node:fs/promises")).readFile(index, "utf8");
  await writeFile(index, html.replace(/<aside class="sidebar"[\s\S]*?<\/aside>/, ""));

  const findings = audit(await readSite(dir));
  assert.deepEqual(findings.map((f) => `${f.page}:${f.rule}`), ["install/index.html:sidebar"]);
});

const chromium = await browser();

test("the fixture is visible in a browser with JavaScript off", { skip: chromium === undefined ? "Playwright and its browsers are not installed" : false }, async () => {
  const built = await readSite(await builtSite("docs-site"));
  assert.deepEqual(await auditInBrowser(built, chromium, ["index.html", "install/index.html"]), []);
});

test("the browser pass fails when CSS hides a code block", { skip: chromium === undefined ? "Playwright and its browsers are not installed" : false }, async (t) => {
  const built = await builtSite("docs-site");
  const dir = await mkdtemp(join(tmpdir(), "nojs-engine-hidden-"));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await cp(built, dir, { recursive: true });
  const index = join(dir, "install/index.html");
  const fs = await import("node:fs/promises");
  const html = await fs.readFile(index, "utf8");
  await fs.writeFile(index, html.replace("</head>", "<style>pre{display:none}</style></head>"));

  const findings = await auditInBrowser(await readSite(dir), chromium, ["install/index.html"]);
  assert.ok(findings.some((finding) => finding.rule === "code"), JSON.stringify(findings));
});
