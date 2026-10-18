// Generates every SVG brand asset from tools/brand/mark.mjs and brand/tokens.json.
//
//   node tools/brand/build.mjs           # write brand/assets, brand/favicon, the logo sheet, and tokens.css
//   node tools/brand/build.mjs --check   # fail if any generated file is missing or out of date
//
// PNG exports are separate (tools/brand/export.mjs) because they need a browser.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { badgeSvg } from "./badge.mjs";
import { BRAND_DIR, VARIANTS, faviconSvg, markSvg, tokensCss } from "./mark.mjs";
import { FAVICON_ICO, FAVICON_PNGS, SHEET, markPngs } from "./outputs.mjs";
import { logoSheet } from "./sheet.mjs";

export function generatedFiles() {
  const files = new Map();
  for (const variant of Object.keys(VARIANTS)) files.set(`assets/slipway-mark-${variant}.svg`, markSvg(variant));
  files.set("assets/badge-built-with.svg", badgeSvg());
  files.set("favicon/favicon.svg", faviconSvg({ rounded: true }));
  files.set("favicon/icon-square.svg", faviconSvg({ rounded: false }));
  files.set(SHEET.source, logoSheet());
  files.set("tokens.css", tokensCss());
  return files;
}

/** Every PNG and the .ico that `npm run export:brand` must have produced. */
export const exportedFiles = () => [...markPngs(Object.keys(VARIANTS)).map((p) => p.output), ...FAVICON_PNGS.map((p) => p.output), FAVICON_ICO.output, SHEET.output];

function main() {
  const check = process.argv.includes("--check");
  const files = generatedFiles();
  const problems = [];
  for (const [rel, content] of files) {
    const path = join(BRAND_DIR, rel);
    if (check) {
      if (!existsSync(path)) problems.push(`missing brand/${rel}`);
      else if (readFileSync(path, "utf8") !== content) problems.push(`brand/${rel} is out of date`);
      continue;
    }
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  }
  if (check) {
    for (const f of exportedFiles()) if (!existsSync(join(BRAND_DIR, f))) problems.push(`missing brand/${f} (run npm run export:brand)`);
    if (problems.length) {
      console.error(problems.map((p) => `brand: ${p}`).join("\n"));
      console.error("brand: regenerate with `npm run build:brand` and `npm run export:brand`");
      process.exit(1);
    }
    console.log(`OK: brand (${files.size} generated files in sync, ${exportedFiles().length} PNG and icon exports present)`);
    return;
  }
  console.log(`Wrote ${files.size} files under brand/`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
