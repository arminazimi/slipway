import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

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

export function handleExplain(id, { log, error }) {
  const docsDir = join(__dirname, "..", "docs", "checks");

  let available = [];
  try {
    available = readdirSync(docsDir).filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));
  } catch (e) {
    error(`slipway: cannot read the check docs at ${docsDir}: ${e.message}`);
    return 2;
  }

  if (!id) {
    log(available.join("\n"));
    return 0;
  }

  if (available.includes(id)) {
    const docPath = join(docsDir, `${id}.md`);
    log(readFileSync(docPath, "utf8"));
    return 0;
  } else {
    error(`slipway: unknown check ID: ${id}`);

    const closest = available
      .map(c => ({ id: c, dist: levenshtein(id, c) }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 3)
      .map(c => c.id);

    if (closest.length > 0) {
      error(`\nDid you mean:\n  ${closest.join("\n  ")}`);
    }
    return 2;
  }
}
