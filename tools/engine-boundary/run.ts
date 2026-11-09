// Engine boundary gate: packages/engine knows nothing about the theme.
//
//   node tools/engine-boundary/run.ts [dir]    scan dir (default packages/engine); exit 1 on any violation
//
// Fails when a source file imports from packages/theme (or @velella/lateen), or when any file names Lateen, a theme
// color, or a layout (ADR 0025: the engine may contain its own name, Mizzen, never the theme's).
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative, basename, extname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(import.meta.url), "../../..");
const SOURCE = new Set([".ts", ".mts", ".cts", ".js", ".mjs", ".cjs", ".json"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".git"]);
const NAME_ALLOWED = new Set(["package.json", "README.md"]);

/** Theme palette names; the engine has no reason to spell them. */
export const themeColors = ["kanagawa", "nord"];
/** Layout names the theme owns. Folder names under packages/theme/layouts are added at run time. */
export const baseLayouts = ["landing", "doc-layout", "home-layout"];

/** Specifiers: `from "x"`, `import "x"`, `import("x")`, `require("x")`, `export ... from "x"`. */
const IMPORT = /(?:\b(?:from|import|require)\s*\(?\s*)(["'`])([^"'`\n]+)\1/g;
const THEME_SPECIFIER = /(?:^|[\\/])packages[\\/]theme(?:[\\/]|$)|^@velella\/lateen(?:\/|$)|(?:^|[\\/])theme[\\/](?:src|layouts|components|chrome|styles|tokens)(?:[\\/]|$)/;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      if (!SKIP_DIRS.has(e.name)) walk(join(dir, e.name), out);
    } else if (SOURCE.has(extname(e.name)) || e.name === "README.md") out.push(join(dir, e.name));
  }
  return out.sort();
}

/** Layout folder names that are ordinary words the engine uses itself (`base` is a config key, `doc` is the engine's PageKind and the layout its own tests default to, `home` names the home page), so they are not deny-listed. */
const GENERIC_LAYOUTS = new Set(["base", "doc", "home"]);

export function layoutNames(repo = root) {
  const dir = join(repo, "packages/theme/layouts");
  const found = existsSync(dir) ? readdirSync(dir).map((f) => f.replace(/\.[^.]+$/, "")).filter((n) => n && n.toLowerCase() !== "readme" && !GENERIC_LAYOUTS.has(n.toLowerCase())) : [];
  return [...new Set([...baseLayouts, ...found])];
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Returns [{ file, line, rule, text }] for every violation under dir. */
export function scan(dir = join(root, "packages/engine"), repo = root) {
  const names = [...themeColors, ...layoutNames(repo)];
  const nameRe = new RegExp(`(?<![A-Za-z0-9])(${names.map(escape).join("|")})(?![A-Za-z0-9])`, "i");
  const hex = /#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b(?![0-9a-zA-Z])/;
  const found = [];
  for (const file of walk(dir)) {
    const rel = relative(dir, file) || basename(file);
    const text = readFileSync(file, "utf8");
    const isTs = file.endsWith(".json") === false && !file.endsWith("README.md");
    text.split("\n").forEach((line, i) => {
      const add = (rule) => found.push({ file: rel, line: i + 1, rule, text: line.trim() });
      if (isTs) {
        for (const m of line.matchAll(IMPORT)) if (THEME_SPECIFIER.test(m[2])) add("imports-theme");
        if (hex.test(line)) add("theme-color");
      }
      if (/lateen/i.test(line)) add("theme-product-name");
      if (nameRe.test(line) && !NAME_ALLOWED.has(basename(file))) add("theme-name");
    });
  }
  return found;
}

export function main(argv = process.argv.slice(2)) {
  const dir = argv[0] ?? join(root, "packages/engine");
  if (!existsSync(dir)) {
    console.error(`engine-boundary: ${dir} does not exist`);
    return 1;
  }
  const found = scan(dir);
  for (const v of found) console.error(`${v.file}:${v.line}  ${v.rule}  ${v.text}`);
  if (found.length) {
    console.error(`engine-boundary: ${found.length} violation(s). The engine knows nothing about the theme.`);
    return 1;
  }
  console.log("engine-boundary: ok");
  return 0;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = main();
