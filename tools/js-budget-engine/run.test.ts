import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { builtSite } from "../fixture-build/build.ts";
import { budget, budgetBytes, compressedBytes, importedSpecifiers, main, pageBudget, scriptTags } from "./run.ts";

/** A temporary build folder; every test that writes files uses one. */
function folder(t: { after: (fn: () => void) => void }, files: Record<string, string | Buffer> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "js-budget-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), content);
  }
  return dir;
}

/** Incompressible-enough text for a budget test, without a random source. */
function noise(length: number): string {
  let state = 1;
  let out = "";
  for (let index = 0; index < length; index++) {
    state = (state * 48271) % 2147483647;
    out += String.fromCharCode(33 + (state % 94));
  }
  return out;
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

test("Brotli sizes shrink repetition and stay deterministic", () => {
  const source = "const answer = 42;\n".repeat(1000);
  const once = compressedBytes(source);
  assert.equal(compressedBytes(source), once);
  assert.ok(once < Buffer.byteLength(source) / 10, `${once} should be far below ${Buffer.byteLength(source)}`);
  assert.ok(compressedBytes(noise(2000)) > compressedBytes("a".repeat(2000)));
});

test("scriptTags finds scripts in order and skips comments", () => {
  const html = [
    "<!-- <script>window.commented = true;</script> -->",
    '<script src="one.js" defer></script>',
    "<script>const two = 2;</script>",
    '<script type="module" src="three.js"></script>',
  ].join("\n");
  const tags = scriptTags(html);
  assert.equal(tags.length, 3);
  assert.equal(tags[0]!.attrs.trim(), 'src="one.js" defer');
  assert.equal(tags[1]!.body, "const two = 2;");
  assert.match(tags[2]!.attrs, /type="module"/);
});

test("importedSpecifiers reads static imports and exports but not dynamic imports", () => {
  const code = [
    'import "side-effect.js";',
    'import value from "default.js";',
    'import { a as b } from "./named.js";',
    'import*as all from "../star.js";',
    'export * from "./export-star.js";',
    'export { x } from "./export-named.js";',
    'export const local = "keep";',
    'import("./dynamic.js");',
    "import.meta.url;",
    'const text = "import \\"not-an-import.js\\"";',
  ].join("\n");
  assert.deepEqual(importedSpecifiers(code), [
    "side-effect.js",
    "default.js",
    "./named.js",
    "../star.js",
    "./export-star.js",
    "./export-named.js",
  ]);
});

test("pageBudget sums each distinct script once and ignores data blocks", (t) => {
  const dir = folder(t, {
    "index.html": [
      "<html><body>",
      '<script type="application/ld+json">{"name":"not javascript"}</script>',
      "<script>const inline = 1;</script>",
      '<script src="./a.js"></script>',
      '<script src="a.js"></script>',
      '<script src="/assets/b.js?v=2#x"></script>',
      "</body></html>",
    ].join("\n"),
    "a.js": "const a = 1;\n",
    "assets/b.js": "const b = 2;\n",
  });

  const page = pageBudget(join(dir, "index.html"), dir);
  assert.deepEqual(page.problems, []);
  assert.deepEqual(page.scripts.map((script) => script.name).sort(), ["(inline)", "a.js", "assets/b.js"]);
  assert.equal(page.bytes, page.scripts.reduce((total, script) => total + script.bytes, 0));
  assert.equal(new Set(page.scripts.map((script) => script.name)).size, 3, "a duplicated src loads once");
});

test("pageBudget follows the module graph, once, and survives cycles", (t) => {
  const dir = folder(t, {
    "guide/index.html": '<script type="module" src="module.js"></script>',
    "guide/module.js": 'import "./dep.js";import "/assets/shared.js";export { x } from "./other.js";',
    "guide/dep.js": 'import "./module.js";',
    "guide/other.js": "export const x = 1;",
    "assets/shared.js": "export const shared = 1;",
  });

  const page = pageBudget(join(dir, "guide/index.html"), dir);
  assert.deepEqual(page.problems, []);
  assert.deepEqual(page.scripts.map((script) => script.name).sort(), [
    "assets/shared.js",
    "guide/dep.js",
    "guide/module.js",
    "guide/other.js",
  ]);
});

test("pageBudget follows imports written into a module script", (t) => {
  const dir = folder(t, {
    "index.html": '<script type="module">import "./island.js";</script>',
    "island.js": "export const ready = true;",
  });

  const page = pageBudget(join(dir, "index.html"), dir);
  assert.deepEqual(page.problems, []);
  assert.deepEqual(page.scripts.map((script) => script.name).sort(), ["(inline)", "island.js"]);
});

test("pageBudget fails on scripts the gate cannot measure", (t) => {
  const dir = folder(t, {
    "index.html": [
      '<script src="missing.js"></script>',
      '<script src="https://cdn.example.com/a.js"></script>',
      '<script src="..%2f..%2foutside.js"></script>',
      '<script src=""></script>',
      '<script type="module">import "preact";</script>',
    ].join("\n"),
  });

  const page = pageBudget(join(dir, "index.html"), dir);
  assert.equal(page.problems.length, 5);
  assert.ok(page.problems.some((problem) => problem.includes('"missing.js" is not in the build')));
  assert.ok(page.problems.some((problem) => problem.includes("outside the build")));
  assert.ok(page.problems.some((problem) => problem.includes("escapes the build folder")));
  assert.ok(page.problems.some((problem) => problem.includes("empty script src")));
  assert.ok(page.problems.some((problem) => problem.includes('bare specifier "preact"')));
});

test("budget rejects a folder that does not exist or has no pages", (t) => {
  assert.ok(budget(join(tmpdir(), "slipway-js-budget-missing")).problems[0]!.includes("does not exist"));
  const empty = folder(t, { "index.md": "# Not a page\n" });
  assert.ok(budget(empty).problems[0]!.includes("no HTML pages"));
});

test("the gate passes fixtures/docs-site and fails a deliberately broken copy", async (t) => {
  const docs = await builtSite("docs-site");
  const report = budget(docs);
  assert.deepEqual(report.problems, []);
  assert.deepEqual(report.over, []);
  assert.ok(report.pages.length >= 500, `expected the docs fixture, found ${report.pages.length} pages`);
  assert.ok(report.pages.every((page) => page.bytes <= budgetBytes));
  assert.ok(
    report.pages.some((page) => page.scripts.some((script) => script.name === "dashboard/dashboard.js")),
    "the dashboard's own script is measured",
  );

  const rtl = await builtSite("rtl-site");
  assert.deepEqual(budget(rtl).over, [], "the untouched copy is under budget");

  const copy = join(mkdtempSync(join(tmpdir(), "js-budget-broken-")), "site");
  t.after(() => rmSync(dirname(copy), { recursive: true, force: true }));
  cpSync(rtl, copy, { recursive: true });
  const index = join(copy, "index.html");
  const html = readFileSync(index, "utf8");
  writeFileSync(index, html.replace("</body>", '<script src="huge.js"></script></body>'));
  writeFileSync(join(copy, "huge.js"), noise(200_000));

  const broken = budget(copy);
  assert.equal(broken.over.length, 1);
  assert.equal(broken.over[0]!.page, "index.html");
  assert.ok(broken.over[0]!.bytes > budgetBytes);

  const code = await quiet(() => main([copy]));
  assert.equal(code, 1, "the gate fails the broken copy");
});
