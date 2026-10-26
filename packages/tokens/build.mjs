import { mkdirSync, copyFileSync, writeFileSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const root = join(dir, "../../");
const srcTokens = join(root, "tokens/theme.tokens.json");
const srcCss = join(root, "assets/css");
const srcFonts = join(root, "assets/fonts");

const dist = join(dir, "dist");
mkdirSync(dist, { recursive: true });

// Copy tokens
copyFileSync(srcTokens, join(dist, "theme.tokens.json"));

// Generate tokens.css in dist
import { loadTokens, buildCss } from "../../tools/theme/tokens.mjs";
const tokens = loadTokens(srcTokens);
writeFileSync(join(dist, "tokens.css"), buildCss(tokens));

// Copy other CSS
copyFileSync(join(srcCss, "slipway.css"), join(dist, "slipway.css"));
copyFileSync(join(srcCss, "fonts.css"), join(dist, "fonts.css"));
copyFileSync(join(srcCss, "print.css"), join(dist, "print.css"));

// Copy fonts directory
const distFonts = join(dir, "fonts");
cpSync(srcFonts, distFonts, { recursive: true });

console.log("Built @slipway/tokens in dist/ and copied fonts/");
