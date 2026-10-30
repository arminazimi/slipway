import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readdirSync, rmSync, statSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildExample, exampleNames, root } from "../theme/build.mjs";

// English-only pages hide mirroring bugs: an inline padding, a border, or an icon pinned to the left
// looks right in LTR and wrong in RTL. This builds every example, renders each page with `dir="ltr"`
// and `dir="rtl"`, and reports elements whose boxes and start/end spacing do not mirror.

/** Read the boxes and start/end spacing of every visible element. Runs in the page. */
export const collectElements = () => {
  const html = document.documentElement;
  const dir = getComputedStyle(html).direction;
  const width = html.clientWidth;
  const px = (value) => {
    const n = Number.parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };
  const selectorOf = (el) => {
    let selector = el.tagName.toLowerCase();
    if (el.id) selector += `#${el.id}`;
    const classes = typeof el.className === "string" ? el.className : el.className?.baseVal;
    for (const name of String(classes || "").trim().split(/\s+/).filter(Boolean).slice(0, 2)) {
      selector += `.${name}`;
    }
    return selector;
  };

  const elements = [];
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("pre, code, script, style, svg, iframe, head")) continue;
    const rect = el.getBoundingClientRect();
    if (!rect.width || !rect.height) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;
    const parent = el.parentElement;
    const parentRect = parent?.getBoundingClientRect();
    const parentStyle = parent ? getComputedStyle(parent) : null;
    elements.push({
      selector: selectorOf(el),
      direction: style.direction,
      display: style.display,
      position: style.position,
      left: px(style.left),
      right: px(style.right),
      paddingLeft: px(style.paddingLeft),
      paddingRight: px(style.paddingRight),
      borderLeftWidth: px(style.borderLeftWidth),
      borderRightWidth: px(style.borderRightWidth),
      marginLeft: px(style.marginLeft),
      marginRight: px(style.marginRight),
      x: rect.x,
      width: rect.width,
      height: rect.height,
      parent: parentRect
        ? {
            x: parentRect.x,
            width: parentRect.width,
            paddingLeft: px(parentStyle.paddingLeft),
            paddingRight: px(parentStyle.paddingRight),
          }
        : null,
    });
  }
  return { dir, width, elements };
};

const spacing = [
  ["paddingLeft", "paddingRight", "padding"],
  ["borderLeftWidth", "borderRightWidth", "border"],
  ["marginLeft", "marginRight", "margin"],
];

/** The issues where the RTL pass does not mirror the LTR pass. `ltr` and `rtl` come from `collectElements`. */
export function compare(ltr, rtl, tolerance = 2) {
  const issues = [];
  const round = (n) => Math.round(n * 10) / 10;
  const report = (selector, kind, detail) => issues.push({ selector, kind, detail });

  if (Math.abs(ltr.width - rtl.width) > tolerance) {
    report("html", "width", `the layout viewport changes with direction (${ltr.width}px LTR, ${rtl.width}px RTL)`);
  }

  const count = Math.min(ltr.elements.length, rtl.elements.length);
  for (let i = 0; i < count; i++) {
    const a = ltr.elements[i];
    const b = rtl.elements[i];
    // Content that pins its direction (`dir="ltr"` on code and terminals) is exempt by design.
    if (a.direction !== ltr.dir || b.direction !== rtl.dir) continue;

    let flagged = false;
    for (const [left, right, kind] of spacing) {
      if (Math.abs(a[left] - a[right]) <= tolerance) continue;
      if (Math.abs(b[left] - a[right]) > tolerance || Math.abs(b[right] - a[left]) > tolerance) {
        flagged = true;
        report(a.selector, kind, `${round(a[left])}/${round(a[right])} LTR stays ${round(b[left])}/${round(b[right])} in RTL`);
      }
    }

    if (a.position === "absolute" || a.position === "fixed") {
      if (Math.abs(a.left - a.right) > tolerance && (Math.abs(b.left - a.right) > tolerance || Math.abs(b.right - a.left) > tolerance)) {
        flagged = true;
        report(a.selector, "inset", `${round(a.left)}/${round(a.right)} LTR stays ${round(b.left)}/${round(b.right)} in RTL`);
      }
      continue;
    }

    if (flagged || a.display === "inline" || a.display === "contents" || !a.parent || !b.parent) continue;
    const content = (e) => {
      const left = e.parent.x + e.parent.paddingLeft;
      const right = e.parent.x + e.parent.width - e.parent.paddingRight;
      return { left, right, width: right - left };
    };
    const box = content(a);
    const mirrored = content(b);
    if (box.width <= tolerance || a.width >= box.width - tolerance) continue;
    const gapStart = a.x - box.left;
    const gapEnd = box.right - (a.x + a.width);
    const expected = gapStart <= gapEnd ? mirrored.right - gapStart - a.width : mirrored.left + gapEnd;
    if (Math.abs(b.x - expected) > tolerance) {
      report(a.selector, "box", `x ${round(a.x)} LTR should mirror to ${round(expected)}, is ${round(b.x)}`);
    }
  }
  return issues;
}

function htmlFiles(dir, found = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) htmlFiles(path, found);
    else if (path.endsWith(".html")) found.push(path);
  }
  return found;
}

function browsersMissing() {
  let playwrightDir;
  if (platform() === "darwin") playwrightDir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
  else if (platform() === "win32") playwrightDir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
  else playwrightDir = join(process.env.HOME || "", ".cache/ms-playwright");
  return !existsSync(playwrightDir);
}

export async function main() {
  if (browsersMissing()) {
    console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` to run the pseudo-RTL check.");
    return 0;
  }
  if (spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" }).status !== 0) {
    console.log("SKIP: Ruby and `bundle install` are required to build the examples for the pseudo-RTL check.");
    return 0;
  }

  const { chromium } = await import("playwright");
  const outDir = mkdtempSync(join(tmpdir(), "slipway-pseudo-rtl-"));
  let browser;
  let failures = 0;
  try {
    console.log("Building example sites for the pseudo-RTL check...");
    const pages = [];
    for (const name of exampleNames()) {
      const siteOut = join(outDir, name);
      mkdirSync(siteOut, { recursive: true });
      buildExample("gem", siteOut, name);
      for (const file of htmlFiles(siteOut)) {
        pages.push({ name: file.slice(outDir.length + 1), url: `file://${file}` });
      }
    }

    console.log("Rendering each page with dir=ltr and dir=rtl...");
    browser = await chromium.launch();
    const page = await browser.newPage();

    for (const { name, url } of pages) {
      await page.goto(url);
      await page.evaluate(() => document.documentElement.setAttribute("dir", "ltr"));
      const ltr = await page.evaluate(collectElements);
      await page.evaluate(() => document.documentElement.setAttribute("dir", "rtl"));
      await page.waitForTimeout(50);
      const rtl = await page.evaluate(collectElements);

      const issues = compare(ltr, rtl);
      if (!issues.length) continue;
      failures += issues.length;
      for (const issue of issues) console.error(`${name}: ${issue.selector} ${issue.kind}: ${issue.detail}`);
    }
  } finally {
    if (browser) await browser.close();
    rmSync(outDir, { recursive: true, force: true });
  }

  if (failures) {
    console.error(`\nPseudo-RTL check failed: ${failures} element(s) do not mirror.`);
    return 1;
  }
  console.log("Pseudo-RTL check passed.");
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exitCode = await main();
}
