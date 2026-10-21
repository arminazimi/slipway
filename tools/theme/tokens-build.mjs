// Writes assets/css/tokens.css and docs/tokens.md from tokens/theme.tokens.json; with --check, fails when it is out of date.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildTokenDocs } from "./tokens-docs.mjs";
import { buildCss, loadTokens, root, tokensPath } from "./tokens.mjs";

export const cssPath = join(root, "assets/css/tokens.css");
export const docsPath = join(root, "docs/tokens.md");

const outputs = (tokens, { css = cssPath, docs = docsPath } = {}) =>
  [[css, buildCss(tokens)], [docs, buildTokenDocs(tokens)]].filter(([path]) => path);

/** Returns the files that differ from what the tokens produce (empty when up to date). */
export function staleOutputs(tokens = loadTokens(tokensPath), paths) {
  return outputs(tokens, paths)
    .filter(([path, content]) => (existsSync(path) ? readFileSync(path, "utf8") : null) !== content)
    .map(([path]) => path);
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
  for (const [path, content] of outputs(tokens)) writeFileSync(path, content);
  console.log("wrote assets/css/tokens.css and docs/tokens.md");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
