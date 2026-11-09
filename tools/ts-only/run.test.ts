import assert from "node:assert/strict";
import { test } from "node:test";
import { readLegacy, violations } from "./run.ts";

test("new .js, .mjs, .cjs, and .tsx files fail; legacy, client, and TypeScript files pass", () => {
  const legacy = new Set(["tools/old/run.mjs"]);
  const files = ["tools/old/run.mjs", "tools/new/run.mjs", "packages/x/a.js", "packages/x/b.cjs", "packages/theme/c/index.tsx", "assets/js/search.js", "packages/x/ok.ts", "README.md"];
  assert.deepEqual(violations(files, legacy), ["tools/new/run.mjs", "packages/x/a.js", "packages/x/b.cjs", "packages/theme/c/index.tsx"]);
});

test("legacy.txt lists no .tsx file and nothing under assets/js/", () => {
  const legacy = [...readLegacy()];
  assert.ok(legacy.length > 0);
  assert.ok(!legacy.some((f) => f.endsWith(".tsx") || f.startsWith("assets/js/")));
});
