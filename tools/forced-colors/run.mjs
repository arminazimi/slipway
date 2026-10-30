// Forced-colors check: loads every example site with `forced-colors: active`, light and dark, and looks
// for focus rings, control borders, and icons that the system palette would hide.
// Prints SKIP and exits 0 when Playwright or Ruby is missing, like the other browser tools.
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync, rmSync, mkdtempSync, statSync } from "node:fs";
import { tmpdir, platform } from "node:os";
import { extname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildExample, exampleNames } from "../theme/build.mjs";

const root = join(fileURLToPath(import.meta.url), "../../..");

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".xml": "application/xml",
};

/** Serves `dir` on a random localhost port, so pages get real URLs and load their stylesheets. */
export async function serve(dir) {
  const rootDir = resolve(dir);
  const server = createServer((request, response) => {
    let path;
    try {
      path = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    } catch {
      response.writeHead(400);
      response.end("bad request");
      return;
    }
    let file = resolve(rootDir, `.${path}`);
    if (!file.startsWith(rootDir + sep) && file !== rootDir) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
    if (!existsSync(file) || !statSync(file).isFile()) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    response.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    response.end(readFileSync(file));
  });
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  return server;
}

/** The controls and icons on the page that forced colors would hide, read from the page's computed styles. */
export async function inspectPage(page) {
  return page.evaluate(() => {
    const visible = (el) => {
      if (el.closest("[hidden]")) return false;
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") return false;
      return el.getClientRects().length > 0;
    };
    const describe = (el) => {
      let name = el.tagName.toLowerCase();
      if (el.id) name += `#${el.id}`;
      if (typeof el.className === "string") {
        const classes = el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (classes.length) name += `.${classes.join(".")}`;
      }
      const text = (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 30);
      return text ? `${name} "${text}"` : name;
    };
    const findings = [];
    const seen = new Set();
    const add = (finding) => {
      const key = `${finding.rule}|${finding.element}|${finding.detail}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push(finding);
    };

    for (const el of document.querySelectorAll('button, input:not([type="hidden"]), select, textarea, [role="button"]')) {
      if (!visible(el)) continue;
      const style = getComputedStyle(el);
      if (style.forcedColorAdjust === "none") continue;
      const bordered = ["Top", "Right", "Bottom", "Left"].some((side) => parseFloat(style[`border${side}Width`]) > 0);
      if (!bordered) add({ rule: "border", element: describe(el), detail: "has no border, and forced colors removes its background" });
    }

    for (const svg of document.querySelectorAll("svg")) {
      if (!visible(svg)) continue;
      for (const shape of svg.querySelectorAll("path, circle, ellipse, rect, line, polyline, polygon")) {
        const style = getComputedStyle(shape);
        for (const property of ["fill", "stroke"]) {
          const value = style[property];
          if (!value || value === "none" || value === style.color) continue;
          add({ rule: "icon", element: describe(svg), detail: `draws with ${property} ${value}; use currentColor so forced colors can replace it` });
        }
      }
    }

    for (const el of document.querySelectorAll("*")) {
      if (!visible(el)) continue;
      const style = getComputedStyle(el);
      if (style.forcedColorAdjust === "none") continue;
      const image = style.backgroundImage;
      if (image && image !== "none" && image.startsWith("url(")) {
        add({ rule: "icon", element: describe(el), detail: "draws an icon with background-image, which forced colors removes" });
      }
    }

    return findings;
  });
}

/** Tabs through the page the way a keyboard user does, so `:focus-visible` applies, and reports controls without an outline. */
export async function checkFocus(page) {
  const findings = [];
  for (let step = 0; step < 500; step++) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body || el === document.documentElement) return null;
      if (el.dataset.forcedColorsSeen) return { done: true };
      el.dataset.forcedColorsSeen = "1";
      const style = getComputedStyle(el);
      let name = el.tagName.toLowerCase();
      if (el.id) name += `#${el.id}`;
      if (typeof el.className === "string") {
        const classes = el.className.trim().split(/\s+/).filter(Boolean).slice(0, 2);
        if (classes.length) name += `.${classes.join(".")}`;
      }
      const text = (el.textContent || el.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 30);
      return {
        element: text ? `${name} "${text}"` : name,
        outline: style.outlineStyle,
        width: parseFloat(style.outlineWidth),
        visible: el.getClientRects().length > 0,
      };
    });
    if (state === null || state.done) break;
    if (state.visible && (state.outline === "none" || !(state.width > 0))) {
      findings.push({ rule: "focus", element: state.element, detail: "has no outline when focused" });
    }
  }
  return findings;
}

/** Whether Playwright's browsers are installed, as the other browser tools decide it. */
export function browsersInstalled() {
  let dir;
  if (platform() === "darwin") dir = join(process.env.HOME || "", "Library/Caches/ms-playwright");
  else if (platform() === "win32") dir = join(process.env.USERPROFILE || process.env.LOCALAPPDATA || "", "AppData/Local/ms-playwright");
  else dir = join(process.env.HOME || "", ".cache/ms-playwright");
  return existsSync(dir);
}

export async function main() {
  if (!browsersInstalled()) {
    console.log("SKIP: Playwright browsers are not installed. Run `npx playwright install` or `npx playwright install --with-deps` to run forced-colors tests.");
    return 0;
  }
  const jekyll = spawnSync("bundle", ["exec", "jekyll", "--version"], { cwd: root, encoding: "utf8" });
  if (jekyll.status !== 0) {
    console.log("SKIP: Ruby and `bundle install` are required to build the site for forced-colors tests.");
    return 0;
  }
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    console.log("SKIP: Playwright is not installed. Run `npm install`.");
    return 0;
  }

  const outDir = mkdtempSync(join(tmpdir(), "slipway-forced-colors-"));
  let browser;
  try {
    const sites = [];
    for (const name of exampleNames()) {
      const out = join(outDir, name);
      buildExample("gem", out, name);
      sites.push({ name, out });
    }

    browser = await chromium.launch();
    let found = 0;
    for (const site of sites) {
      // Each site is served at the server root, because its pages link stylesheets and scripts from `/assets`.
      const server = await serve(site.out);
      const { port } = server.address();
      try {
        for (const scheme of ["light", "dark"]) {
          const context = await browser.newContext({ colorScheme: scheme, viewport: { width: 1280, height: 900 } });
          const page = await context.newPage();
          await page.emulateMedia({ forcedColors: "active", colorScheme: scheme });
          await page.goto(`http://127.0.0.1:${port}/index.html`, { waitUntil: "load", timeout: 30000 });
          const findings = [...(await inspectPage(page)), ...(await checkFocus(page))];
          for (const finding of findings) {
            found++;
            console.error(`${site.name} (${scheme}): ${finding.rule}: ${finding.element} ${finding.detail}`);
          }
          await context.close();
        }
      } finally {
        await new Promise((done) => server.close(done));
      }
    }
    if (found) {
      console.error(`Forced-colors check failed with ${found} finding(s).`);
      return 1;
    }
    console.log(`Forced-colors check passed on ${sites.length} example sites, light and dark.`);
    return 0;
  } finally {
    if (browser) await browser.close();
    rmSync(outDir, { recursive: true, force: true });
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then((code) => { process.exitCode = code; }, (error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
