// Renders brand PNGs and the .ico from the SVG sources with headless Chrome.
//
//   node tools/brand/export.mjs          # export every PNG
//
// Chrome is found through $CHROME or the usual install paths. Fonts fall back to system fonts
// (Inter and IBM Plex Mono are used if installed), so export on a machine with them for the final look.

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { icoFromPngs } from "./ico.mjs";
import { BRAND_DIR, VARIANTS } from "./mark.mjs";
import { FAVICON_ICO, FAVICON_PNGS, MARK_PNG_SIZE, SHEET, markPngs } from "./outputs.mjs";

const CANDIDATES = [
  process.env.CHROME,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean);
const chrome = CANDIDATES.find((p) => existsSync(p));
if (!chrome) {
  console.error("No Chrome found. Set CHROME to a Chrome or Chromium executable.");
  process.exit(1);
}

const scratch = mkdtempSync(join(tmpdir(), "slipway-brand-"));

function render(source, output, width, height, background) {
  const page = join(scratch, `${Math.random().toString(36).slice(2)}.html`);
  writeFileSync(page, `<!doctype html><html><body style="margin:0;background:${background ?? "transparent"}"><img src="${pathToFileURL(source).href}" width="${width}" height="${height}" style="display:block"></body></html>`);
  mkdirSync(dirname(output), { recursive: true });
  const args = [
    "--headless=new",
    "--disable-gpu",
    "--no-first-run",
    `--user-data-dir=${join(scratch, `profile-${Math.random().toString(36).slice(2)}`)}`,
    "--hide-scrollbars",
    "--force-device-scale-factor=1",
    `--window-size=${width},${height}`,
    ...(background === null ? ["--default-background-color=00000000"] : []),
    `--screenshot=${output}`,
    pathToFileURL(page).href,
  ];
  execFileSync(chrome, args, { stdio: "ignore" });
}

let count = 0;
for (const { source, output } of markPngs(Object.keys(VARIANTS))) {
  render(join(BRAND_DIR, source), join(BRAND_DIR, output), MARK_PNG_SIZE, MARK_PNG_SIZE, null);
  count++;
}
for (const f of FAVICON_PNGS) {
  render(join(BRAND_DIR, f.source), join(BRAND_DIR, f.output), f.size, f.size, null);
  count++;
}
writeFileSync(join(BRAND_DIR, FAVICON_ICO.output), icoFromPngs(FAVICON_ICO.sizes.map((size) => ({ size, png: readFileSync(join(BRAND_DIR, `favicon/favicon-${size}.png`)) }))));
count++;
render(join(BRAND_DIR, SHEET.source), join(BRAND_DIR, SHEET.output), SHEET.width, SHEET.height, SHEET.background);
count++;
console.log(`Exported ${count} files with ${chrome}`);
