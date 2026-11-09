import assert from "node:assert/strict";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { builtSite } from "../fixture-build/build.ts";
import { budget, budgetBytes, compressedBytes, main } from "./run.ts";

/** A temporary build folder; every test that writes files uses one. */
function folder(t: { after: (fn: () => void) => void }, files: Record<string, string | Buffer> = {}): string {
  const dir = mkdtempSync(join(tmpdir(), "css-budget-"));
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

test("the budget is 40 KB of compressed bytes", () => {
  assert.equal(budgetBytes, 40960);
});

test("Brotli sizes shrink repetition and stay deterministic", () => {
  const source = ".callout { color: var(--text); }\n".repeat(1000);
  const once = compressedBytes(source);
  assert.equal(compressedBytes(source), once);
  assert.ok(once < Buffer.byteLength(source) / 10, `${once} should be far below ${Buffer.byteLength(source)}`);
  assert.ok(compressedBytes(noise(2000)) > compressedBytes("a".repeat(2000)));
});

test("budget sums every stylesheet, wherever the build wrote it", (t) => {
  const dir = folder(t, {
    "assets/theme/base-0123456789abcdef.css": ".base { color: red; }\n",
    "assets/theme/page-0123456789abcdef.css": ".page { color: blue; }\n",
    "dashboard/style.css": ".dash { display: grid; }\n",
    "guide/nested/deep.css": ".deep { margin: 0; }\n",
    "assets/readme.txt": noise(50_000),
  });

  const site = budget(dir);
  assert.deepEqual(site.problems, []);
  assert.deepEqual(site.files.map((file) => file.name).sort(), [
    "assets/theme/base-0123456789abcdef.css",
    "assets/theme/page-0123456789abcdef.css",
    "dashboard/style.css",
    "guide/nested/deep.css",
  ]);
  assert.equal(site.bytes, site.files.reduce((total, file) => total + file.bytes, 0), "the total is the sum of the files");
  for (const file of site.files) {
    const data = readFileSync(join(dir, file.name));
    assert.equal(file.bytes, compressedBytes(data), `${file.name} is compressed on its own`);
    assert.equal(file.raw, data.length);
  }

  const largest = [...site.files].sort((a, b) => b.bytes - a.bytes || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  assert.deepEqual(site.files, largest, "the report lists the largest stylesheets first");
});

test("budget rejects a folder that does not exist or has no stylesheets", (t) => {
  assert.ok(budget(join(tmpdir(), "slipway-css-budget-missing")).problems[0]!.includes("does not exist"));
  const empty = folder(t, { "index.md": "# Not a page\n" });
  assert.ok(budget(empty).problems[0]!.includes("no CSS files"));
});

test("the gate passes fixtures/docs-site and fails a deliberately broken copy", async (t) => {
  const docs = await builtSite("docs-site");
  const report = budget(docs);
  assert.deepEqual(report.problems, []);
  assert.ok(report.bytes <= budgetBytes, `${report.bytes} compressed bytes should fit ${budgetBytes}`);
  assert.ok(report.files.some((file) => file.name === "dashboard/style.css"), "the site's own stylesheet is measured");
  assert.ok(report.files.some((file) => file.name.startsWith("pagefind/")), "the search output's stylesheets are measured");

  const rtl = await builtSite("rtl-site");
  assert.ok(budget(rtl).bytes <= budgetBytes, "the right-to-left fixture is under budget");

  const copy = join(mkdtempSync(join(tmpdir(), "css-budget-broken-")), "site");
  t.after(() => rmSync(dirname(copy), { recursive: true, force: true }));
  cpSync(rtl, copy, { recursive: true });
  assert.ok(budget(copy).bytes <= budgetBytes, "the untouched copy is under budget");

  writeFileSync(join(copy, "huge.css"), noise(200_000));
  const broken = budget(copy);
  assert.ok(broken.bytes > budgetBytes);
  assert.equal(broken.files[0]!.name, "huge.css", "the broken copy's largest file is named");

  const code = await quiet(() => main([copy]));
  assert.equal(code, 1, "the gate fails the broken copy");
  assert.equal(await quiet(() => main([docs])), 0, "the gate passes the real build");
});
