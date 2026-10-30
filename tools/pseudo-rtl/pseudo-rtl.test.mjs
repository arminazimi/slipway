import { test } from "node:test";
import assert from "node:assert";
import { existsSync } from "node:fs";
import { platform } from "node:os";
import { join } from "node:path";
import { collectElements, compare } from "./run.mjs";

const element = (overrides = {}) => ({
  selector: "div",
  direction: "ltr",
  position: "static",
  left: 0,
  right: 0,
  paddingLeft: 0,
  paddingRight: 0,
  borderLeftWidth: 0,
  borderRightWidth: 0,
  marginLeft: 0,
  marginRight: 0,
  x: 0,
  width: 1000,
  height: 20,
  parent: { x: 0, width: 1000, paddingLeft: 0, paddingRight: 0 },
  ...overrides,
});

const pass = (dir, elements) => ({ dir, width: 1000, elements });

test("equal start and end spacing is not an issue", () => {
  const a = element({ paddingLeft: 16, paddingRight: 16 });
  const b = element({ direction: "rtl", paddingLeft: 16, paddingRight: 16 });
  assert.deepStrictEqual(compare(pass("ltr", [a]), pass("rtl", [b])), []);
});

test("asymmetric spacing that swaps in RTL passes", () => {
  const a = element({ paddingLeft: 24, paddingRight: 8 });
  const b = element({ direction: "rtl", paddingLeft: 8, paddingRight: 24 });
  assert.deepStrictEqual(compare(pass("ltr", [a]), pass("rtl", [b])), []);
});

test("physical spacing that does not swap is reported", () => {
  const a = element({ paddingLeft: 24, paddingRight: 8 });
  const b = element({ direction: "rtl", paddingLeft: 24, paddingRight: 8 });
  const issues = compare(pass("ltr", [a]), pass("rtl", [b]));
  assert.strictEqual(issues.length, 1);
  assert.strictEqual(issues[0].kind, "padding");
});

test("a border keeps its side when it should move", () => {
  const a = element({ borderLeftWidth: 4, borderRightWidth: 0 });
  const b = element({ direction: "rtl", borderLeftWidth: 4, borderRightWidth: 0 });
  assert.deepStrictEqual(compare(pass("ltr", [a]), pass("rtl", [b])).map((i) => i.kind), ["border"]);
});

test("a box that does not mirror is reported", () => {
  const a = element({ x: 100, width: 200 });
  const b = element({ direction: "rtl", x: 100, width: 200 });
  const issues = compare(pass("ltr", [a]), pass("rtl", [b]));
  assert.deepStrictEqual(issues.map((i) => i.kind), ["box"]);
});

test("a box that mirrors correctly passes", () => {
  const a = element({ x: 100, width: 200 });
  const b = element({ direction: "rtl", x: 700, width: 200 });
  assert.deepStrictEqual(compare(pass("ltr", [a]), pass("rtl", [b])), []);
});

test("content pinned to ltr is exempt", () => {
  const a = element({ paddingLeft: 24, paddingRight: 8 });
  const b = element({ direction: "ltr", paddingLeft: 24, paddingRight: 8 });
  assert.deepStrictEqual(compare(pass("ltr", [a]), pass("rtl", [b])), []);
});

test("an absolute element whose insets do not swap is reported", () => {
  const a = element({ position: "absolute", left: 0, right: 900 });
  const b = element({ direction: "rtl", position: "absolute", left: 0, right: 900 });
  assert.deepStrictEqual(compare(pass("ltr", [a]), pass("rtl", [b])).map((i) => i.kind), ["inset"]);
});

let browsers = true;
let playwrightDir;
if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");
if (!existsSync(playwrightDir)) browsers = false;

if (!browsers) {
  console.log("SKIP: Playwright browsers are not installed; the fixture check is skipped.");
} else {
  const { chromium } = await import("playwright");

  const render = async (page, html, dir) => {
    await page.setContent(html);
    await page.evaluate((value) => document.documentElement.setAttribute("dir", value), dir);
    return await page.evaluate(collectElements);
  };

  test("a fixture with logical properties passes", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const html = `<!DOCTYPE html><html dir="ltr"><body style="margin:0">
      <div id="card" style="width:300px; padding-inline-start:40px; padding-inline-end:8px">
        <span id="chip" style="display:inline-block; padding-inline-start:12px; padding-inline-end:4px">chip</span>
      </div>
    </body></html>`;
    const issues = compare(await render(page, html, "ltr"), await render(page, html, "rtl"));
    assert.deepStrictEqual(issues, []);
    await browser.close();
  });

  test("a fixture with physical properties is reported", async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    const html = `<!DOCTYPE html><html dir="ltr"><body style="margin:0">
      <div id="card" style="width:300px; padding-left:40px; padding-right:8px">
        <span id="chip" style="display:inline-block; padding-left:12px; padding-right:4px">chip</span>
        <span id="pin" style="position:absolute; left:0">pin</span>
      </div>
    </body></html>`;
    const issues = compare(await render(page, html, "ltr"), await render(page, html, "rtl"));
    const selectors = new Set(issues.map((i) => i.selector));
    assert.ok(selectors.has("div#card"), `expected div#card in ${JSON.stringify(issues)}`);
    assert.ok(selectors.has("span#chip"), `expected span#chip in ${JSON.stringify(issues)}`);
    await browser.close();
  });
}
