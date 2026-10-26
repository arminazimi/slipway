import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";
import { twinOf, twinUrl } from "../src/index.mjs";
import { headingsIn, lineOffset, linksIn } from "../src/markdown.mjs";

const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const modules = process.env.ELEVENTY_MODULES;
const cli = modules && join(modules, "@11ty/eleventy/cmd.cjs");
const skip = cli && existsSync(cli) ? false : "set ELEVENTY_MODULES to a node_modules folder with Eleventy to run it";

let built = null;
function build() {
  if (built) return built;
  const dir = mkdtempSync(join(tmpdir(), "slipway-eleventy-"));
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, dir, { recursive: true });
  cpSync(join(adapter, "starter"), dir, { recursive: true });
  symlinkSync(modules, join(dir, "node_modules"), "dir");
  cpSync(adapter, join(dir, "node_modules/slipway-eleventy"), { recursive: true });
  const result = spawnSync(process.execPath, [cli], { cwd: dir, env: process.env, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return (built = dir);
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async () => {
  const dir = build();
  const report = await doctor(dir, { build: join(dir, "_site") });
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "eleventy");
  assert.equal(report.level, "L2");
});

test("sourcemap.json lists every Markdown page, with headings and links at their source lines", { skip }, () => {
  const dir = build();
  const map = JSON.parse(read(dir, "_site/sourcemap.json"));
  assert.deepEqual(validateSourcemap(map), { ok: true, errors: [] });
  const index = page(map, "/");
  assert.deepEqual(index.sections, [
    { id: "welcome", level: 2, line: 9, text: "Welcome" }
  ]);
  assert.deepEqual(index.links, [{ href: "https://example.com", line: 11 }]);
});

test("each page has a Markdown twin, linked from its head", { skip }, () => {
  const dir = build();
  const html = read(dir, "_site/index.html");
  assert.match(html, /<link rel="alternate" type="text\/markdown" href="\/index.md">/);
  const twin = read(dir, "_site/index.md");
  assert.ok(twin.includes("# Home"), twin);
  assert.ok(twin.includes("Welcome to the site!"), twin);
});

test("a stale heading line is caught by slipway doctor", { skip }, async () => {
  const dir = build();
  const intro = join(dir, "src/index.md");
  const before = readFileSync(intro, "utf8");
  writeFileSync(intro, before.replace("## Welcome", "\n\n\n## Welcome"));
  try {
    const report = await doctor(dir, { build: join(dir, "_site") });
    assert.ok(report.findings.some((f) => f.id === "ae.sourcemap.lines" && f.file === "src/index.md"), JSON.stringify(report.findings));
  } finally {
    writeFileSync(intro, before);
  }
});
