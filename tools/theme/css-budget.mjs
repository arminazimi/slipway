// The CSS budget: the theme ships a lightweight stylesheet that stays small.
//
//   - assets/css/*.css together weigh at most 39 KB (raw bytes), enforced here and in `npm run check`.
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { root } from "./tokens.mjs";

export const budgetBytes = 39 * 1024; // 39 KB

/** Every file in assets/css with its size in bytes. */
export function stylesheetSizes(dir = join(root, "assets/css")) {
  return readdirSync(dir, { recursive: true })
    .filter((name) => name.endsWith(".css"))
    .map((name) => ({ name, bytes: statSync(join(dir, name)).size }))
    .sort((a, b) => b.bytes - a.bytes);
}

export function totalBytes(sizes = stylesheetSizes()) {
  return sizes.reduce((sum, file) => sum + file.bytes, 0);
}

export function main() {
  const sizes = stylesheetSizes();
  const total = totalBytes(sizes);
  const line = sizes.map((f) => `${f.name} ${f.bytes}`).join(", ");
  if (total > budgetBytes) {
    console.error(`FAIL: CSS budget: ${total} bytes of ${budgetBytes} (${line})`);
    process.exitCode = 1;
  } else console.log(`OK: CSS budget (${total} of ${budgetBytes} bytes: ${line})`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
