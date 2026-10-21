// The JavaScript budget: no page needs a script to be read, and every script the theme ships stays small.
//
//   - assets/js/*.js together weigh at most 10 KB (raw bytes), enforced here and in `npm run check`.
//   - Scripts are deferred, and the controls they enhance (search, theme toggle) are hidden until a script
//     has run, so a visitor without JavaScript sees a plain page. See budgetProblems for the page rules.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { root } from "./tokens.mjs";

export const budgetBytes = 10 * 1024;

/** Every file in assets/js with its size in bytes. */
export function scriptSizes(dir = join(root, "assets/js")) {
  return readdirSync(dir)
    .filter((name) => name.endsWith(".js"))
    .map((name) => ({ name, bytes: statSync(join(dir, name)).size }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function totalBytes(sizes = scriptSizes()) {
  return sizes.reduce((sum, file) => sum + file.bytes, 0);
}

/** Problems in one built HTML page: a blocking script, or a control that shows without JavaScript. */
export function pageProblems(html, name = "page") {
  const problems = [];
  for (const [tag] of html.matchAll(/<script\b[^>]*>/g)) {
    const inlineInit = html.includes(tag + 'try{var t=localStorage.getItem("slipway-theme")');
    if (!/\bdefer\b/.test(tag) && !inlineInit) problems.push(`${name}: a script blocks rendering: ${tag}`);
  }
  for (const [tag] of html.matchAll(/<[a-z]+\b[^>]*\b(?:data-search=|data-theme-toggle)[^>]*>/g)) {
    if (!/\bhidden\b/.test(tag)) problems.push(`${name}: a control that needs JavaScript is visible without it: ${tag.slice(0, 80)}`);
  }
  if (/<noscript/.test(html)) problems.push(`${name}: <noscript> means the page depends on a script`);
  return problems;
}

export function main() {
  const sizes = scriptSizes();
  const total = totalBytes(sizes);
  const line = sizes.map((f) => `${f.name} ${f.bytes}`).join(", ");
  if (total > budgetBytes) {
    console.error(`FAIL: JavaScript budget: ${total} bytes of ${budgetBytes} (${line})`);
    process.exitCode = 1;
  } else console.log(`OK: JavaScript budget (${total} of ${budgetBytes} bytes: ${line})`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
