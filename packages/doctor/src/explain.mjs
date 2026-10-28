// `slipway doctor --explain [<id>]`: prints a check's page from `docs/checks`, or lists every check id.
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const docsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "docs", "checks");

/** The Levenshtein edit distance between `a` and `b`. */
export function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

/** The check ids with a page in `docs/checks`, in folder order. Throws when the folder cannot be read. */
export function checkIds(dir = docsDir) {
  try {
    return readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => f.replace(/\.md$/, ""));
  } catch (caught) {
    throw new Error(`cannot read the check docs at ${dir}: ${caught.message}`);
  }
}

/** Handles `--explain [<id>]`: prints the check's page, or lists all ids. Unknown ids get the closest suggestions. Exits 0 when the id is known; 2 otherwise, and 2 when `docs/checks` cannot be read. Pass `docs` to point at a different docs folder. */
export async function main(id, { log = console.log, error = console.error, docs = docsDir } = {}) {
  let available;
  try {
    available = checkIds(docs);
  } catch (caught) {
    error(`slipway: ${caught.message}`);
    return 2;
  }
  if (!id) {
    log(available.join("\n"));
    return 0;
  }
  if (available.includes(id)) {
    log(readFileSync(join(docs, `${id}.md`), "utf8"));
    return 0;
  }
  error(`slipway: unknown check ID: ${id}`);
  const closest = available
    .map((c) => ({ id: c, dist: levenshtein(id, c) }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .map((c) => c.id);
  if (closest.length > 0) {
    error(`\nDid you mean:\n  ${closest.join("\n  ")}`);
  }
  return 2;
}
