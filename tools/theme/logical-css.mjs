// Lints the theme stylesheets for physical (left/right) CSS. Right-to-left is first class, so every
// rule uses logical properties (margin-inline-start, inset-inline-end, text-align: start).
// overflow-x/y stay: overflow-inline has no Safari support yet.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { root } from "./tokens.mjs";

const physical = [
  /\b(margin|padding|border|scroll-margin|scroll-padding)-(left|right|top|bottom)\b/,
  /\bborder-(top|bottom)-(left|right)-radius\b/,
  /(^|[;{\s])(left|right|top|bottom)\s*:/,
  /\btext-align\s*:\s*(left|right)\b/,
  /\bfloat\s*:\s*(left|right)\b/,
  /\bclear\s*:\s*(left|right)\b/,
  /(?<![\w-])(min-|max-)?(width|height)\s*:/,
];

/** Returns "file:line: text" for every declaration that uses a physical property. */
export function findPhysical(css, name = "css") {
  const found = [];
  const body = css.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));
  body.split("\n").forEach((line, i) => {
    if (/^\s*@(media|container|supports)/.test(line)) return;
    if (physical.some((re) => re.test(line))) found.push(`${name}:${i + 1}: ${line.trim()}`);
  });
  return found;
}

export function themeStylesheets() {
  const dir = join(root, "assets/css");
  return readdirSync(dir).filter((f) => f.endsWith(".css")).map((f) => join(dir, f));
}

export function main() {
  const problems = themeStylesheets().flatMap((file) => findPhysical(readFileSync(file, "utf8"), file.slice(root.length + 1)));
  if (problems.length) {
    console.error(`FAIL: physical CSS properties (use logical ones)\n${problems.map((p) => `  ${p}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log("OK: logical CSS");
}

if (import.meta.url === `file://${process.argv[1]}`) main();
