// Writes assets/css/tokens.css from tokens/theme.tokens.json; with --check, fails when it is out of date.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildCss, loadTokens, root, tokensPath } from "./tokens.mjs";

export const cssPath = join(root, "assets/css/tokens.css");

/** Returns the files that differ from what the tokens produce (empty when up to date). */
export function staleOutputs(tokens = loadTokens(tokensPath), path = cssPath) {
  const current = existsSync(path) ? readFileSync(path, "utf8") : null;
  return current === buildCss(tokens) ? [] : [path];
}

export function main(argv = process.argv.slice(2)) {
  const tokens = loadTokens();
  if (argv.includes("--check")) {
    const stale = staleOutputs(tokens);
    if (stale.length) {
      console.error(`FAIL: ${stale.join(", ")} is out of date; run \`npm run build:tokens\``);
      process.exitCode = 1;
    } else console.log("OK: tokens");
    return;
  }
  writeFileSync(cssPath, buildCss(tokens));
  console.log("wrote assets/css/tokens.css");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
