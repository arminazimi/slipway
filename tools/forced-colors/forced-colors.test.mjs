// Unit tests for the forced-colors checker: a good fixture passes, a broken one reports each rule.
import test from "node:test";
import assert from "node:assert/strict";
import { inspectPage, checkFocus, browsersInstalled, serve } from "./run.mjs";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  chromium = null;
}
const available = Boolean(chromium) && browsersInstalled();
const skip = available ? false : "Playwright and its browsers are not installed";

const good = `<!doctype html>
<style>
  button { border: 1px solid CanvasText; background: Canvas; color: CanvasText; }
  a:focus { outline: 2px solid; }
</style>
<a href="#">Link</a>
<button type="button">Save</button>
<svg width="16" height="16"><path fill="currentColor" d="M0 0h10v10H0z"></path></svg>`;

const broken = `<!doctype html>
<style>
  button { border: 0; background: #06c; color: #fff; }
  a { outline: none; }
  .icon { display: inline-block; inline-size: 16px; block-size: 16px; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E"); }
</style>
<a href="#">Link</a>
<button type="button">Save</button>
<svg width="16" height="16"><path style="fill: #f00" d="M0 0h10v10H0z"></path></svg>
<span class="icon"></span>`;

async function open(html) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.emulateMedia({ forcedColors: "active", colorScheme: "light" });
  await page.setContent(html);
  return { browser, page };
}

test("a page with borders, currentColor icons, and a focus outline has no findings", { skip }, async () => {
  const { browser, page } = await open(good);
  try {
    const findings = [...(await inspectPage(page)), ...(await checkFocus(page))];
    assert.deepEqual(findings, []);
  } finally {
    await browser.close();
  }
});

test("a page that relies on backgrounds, fixed icon colors, and no focus outline reports each rule", { skip }, async () => {
  const { browser, page } = await open(broken);
  try {
    const findings = [...(await inspectPage(page)), ...(await checkFocus(page))];
    const rules = new Set(findings.map((finding) => finding.rule));
    assert.deepEqual([...rules].sort(), ["border", "focus", "icon"]);
    assert.ok(findings.some((finding) => finding.rule === "icon" && finding.detail.includes("fill")));
    assert.ok(findings.some((finding) => finding.rule === "icon" && finding.detail.includes("background-image")));
    assert.ok(findings.some((finding) => finding.rule === "border" && finding.element.startsWith("button")));
    assert.ok(findings.some((finding) => finding.rule === "focus" && finding.element.startsWith("a")));
  } finally {
    await browser.close();
  }
});

test("the local server refuses paths outside the built site", async () => {
  const dir = mkdtempSync(join(tmpdir(), "forced-colors-serve-"));
  const server = await serve(dir);
  try {
    writeFileSync(join(dir, "index.html"), "<!doctype html><title>ok</title>");
    const { port } = server.address();
    const inside = await fetch(`http://127.0.0.1:${port}/index.html`);
    assert.equal(inside.status, 200);
    assert.match(await inside.text(), /ok/);
    const outside = await fetch(`http://127.0.0.1:${port}/%2e%2e/%2e%2e/etc/passwd`);
    assert.equal(outside.status, 404);
  } finally {
    await new Promise((done) => server.close(done));
    rmSync(dir, { recursive: true, force: true });
  }
});
