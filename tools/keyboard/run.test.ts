import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { builtSite } from "../fixture-build/build.ts";
import {
  collectIslands,
  contentType,
  findCodeTabsPage,
  FIXTURE,
  keyboardRun,
  pageUrl,
  probeHtml,
  relativeImports,
  root,
  withIslandScript,
  withThemeAssets,
} from "./run.ts";

/** A temporary folder; every test that writes files uses one. */
function folder(t: { after: (fn: () => void) => void }, files: Record<string, string> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "keyboard-gate-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

/** Runs a test with console output silenced, so a gate that reports a failure stays quiet in the test log. */
async function quiet<T>(fn: () => Promise<T>): Promise<T> {
  const [log, error] = [console.log, console.error];
  console.log = console.error = () => {};
  try {
    return await fn();
  } finally {
    console.log = log;
    console.error = error;
  }
}

test("the island script goes before the body close, or at the end when there is none", () => {
  assert.equal(withIslandScript("<body>page</body>"), '<body>page<script type="module" src="/islands/all.js"></script></body>');
  assert.equal(withIslandScript("<main>page</main>"), '<main>page</main><script type="module" src="/islands/all.js"></script>');
});

test("theme assets add the stylesheet, the search dialog, and the islands", () => {
  const theme = { css: "body{margin:0}", search: '<dialog data-search="" hidden></dialog>' };
  const page = '<html><head></head><body><button data-search-open=""></button></body></html>';
  const out = withThemeAssets(page, theme);
  assert.match(out, /<link rel="stylesheet" href="\/islands\/theme\.css">/);
  assert.match(out, /<dialog data-search=""/);
  assert.match(out, /src="\/islands\/all\.js"/);
  assert.ok(out.indexOf("data-search=") < out.indexOf("/islands/all.js"), "the dialog comes before the script that wires it");
});

test("theme assets leave a page with a stylesheet and a search dialog alone", () => {
  const theme = { css: "body{}", search: '<dialog data-search="" hidden></dialog>' };
  const page = '<html><head><link rel="stylesheet" href="/site.css"></head><body><button data-search-open=""></button><dialog data-search=""></dialog></body></html>';
  const out = withThemeAssets(page, theme);
  assert.doesNotMatch(out, /\/islands\/theme\.css/);
  assert.equal(out.match(/data-search=""/g)?.length, 1);
});

test("theme assets do not add a search dialog to a page without a search button", () => {
  const theme = { css: "body{}", search: '<dialog data-search="" hidden></dialog>' };
  const out = withThemeAssets("<html><head></head><body><main></main></body></html>", theme);
  assert.doesNotMatch(out, /data-search=/);
  assert.match(out, /src="\/islands\/all\.js"/);
});

test("relativeImports keeps local imports and drops bare and dynamic ones", () => {
  assert.deepEqual(relativeImports('import "./sync.ts";\nimport { a } from "../a.ts";\nimport x from "preact";\nimport("dyn.ts");'), [
    "./sync.ts",
    "../a.ts",
  ]);
});

test("the island bundle follows the code-tabs sync module and leaves the server-only theme toggle out", async () => {
  const islands = await collectIslands(join(root, "packages/theme"));
  assert.ok(islands.files.has("/islands/chrome/drawer/client.ts"));
  assert.ok(islands.files.has("/islands/chrome/search/client.ts"));
  assert.ok(islands.files.has("/islands/chrome/sidebar/client.ts"));
  assert.ok(islands.files.has("/islands/components/code-tabs/client.ts"));
  assert.ok(islands.files.has("/islands/components/code-tabs/sync.ts"), "the client's relative import is served too");
  assert.ok(!islands.files.has("/islands/chrome/theme-toggle/client.ts"), "the theme toggle imports the server layout");
  assert.match(islands.all, /import "\/islands\/chrome\/drawer\/client\.ts";/);
  assert.match(islands.all, /import "\/islands\/components\/code-tabs\/client\.ts";/);
});

test("the code-tabs probe renders two tabs and two panels from the theme component", async () => {
  const html = await probeHtml();
  assert.match(html, /data-code-tabs/);
  assert.equal(html.match(/role="tab"/g)?.length, 2);
  assert.equal(html.match(/class="code-tabs-panel"/g)?.length, 2);
  assert.match(html, />npm</);
  assert.match(html, />pnpm</);
});

test("a built page with code tabs is found and a build without one says so", (t) => {
  const dir = folder(t, {
    "index.html": "<main>no tabs</main>",
    "guide/index.html": '<div data-code-tabs=""></div>',
  });
  assert.equal(findCodeTabsPage(dir), "/guide/");

  const empty = folder(t, { "index.html": "<main>no tabs</main>" });
  assert.equal(findCodeTabsPage(empty), undefined);
});

test("pageUrl maps build files to the URLs a host serves", () => {
  assert.equal(pageUrl("/build", "/build/index.html"), "/");
  assert.equal(pageUrl("/build", "/build/guide/index.html"), "/guide/");
  assert.equal(pageUrl("/build", "/build/404.html"), "/404.html");
});

test("contentType lets the browser run islands and fetch Pagefind's data", () => {
  assert.equal(contentType("a.ts"), "text/javascript; charset=utf-8");
  assert.equal(contentType("a.js"), "text/javascript; charset=utf-8");
  assert.equal(contentType("a.css"), "text/css; charset=utf-8");
  assert.equal(contentType("wasm.en.pagefind"), "application/wasm");
  assert.equal(contentType("a.pf_meta"), "application/octet-stream");
});

test("the gate passes fixtures/docs-site and fails a deliberately broken copy", async (t) => {
  const build = await builtSite(FIXTURE);
  const clean = await keyboardRun(build);
  if ("skip" in clean) {
    t.skip(clean.skip);
    return;
  }

  try {
    const result = await quiet(() => clean.run());
    assert.deepEqual(result.findings, [], "the docs fixture passes every keyboard flow");
    assert.ok(result.notes.some((note) => /search dialog/.test(note)), "the gate says it supplied the search dialog");
    assert.ok(result.notes.some((note) => /code tabs/.test(note)), "the gate says it used a code-tabs probe");
  } finally {
    await clean.close();
  }

  // A copy without the skip link is the "deliberately broken fixture" the issue asks for.
  const copy = join(folder(t), "site");
  cpSync(build, copy, { recursive: true });
  const page = join(copy, "install", "index.html");
  const html = readFileSync(page, "utf8");
  assert.match(html, /<a class="skip-link"/, "the fixture page has a skip link");
  writeFileSync(page, html.replace(/<a class="skip-link"[^>]*>Skip to content<\/a>/, ""));

  const broken = await keyboardRun(copy);
  assert.ok(!("skip" in broken), "the same browser tests the broken copy");
  try {
    const result = await quiet(() => broken.run());
    assert.ok(
      result.findings.some((finding) => finding.step === "skip" && /skip link/.test(finding.message)),
      `expected a skip-link finding, got ${JSON.stringify(result.findings)}`,
    );
  } finally {
    await broken.close();
  }
});
