import test from "node:test";
import assert from "node:assert/strict";
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, appendFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { scan, main } from "./run.ts";

const repo = join(fileURLToPath(import.meta.url), "../../..");
const engine = join(repo, "packages/engine");
const quiet = (fn) => {
  const [log, err] = [console.log, console.error];
  console.log = console.error = () => {};
  try { return fn(); } finally { [console.log, console.error] = [log, err]; }
};

/** A fresh copy of the engine to break on purpose. */
function copy() {
  const dir = mkdtempSync(join(tmpdir(), "engine-boundary-"));
  cpSync(engine, dir, { recursive: true, filter: (s) => !s.includes("node_modules") });
  return dir;
}
const rules = (dir) => scan(dir).map((v) => v.rule);

test("passes on the real engine and on fixtures/docs-site", () => {
  assert.deepEqual(scan(engine), []);
  assert.deepEqual(scan(join(repo, "fixtures/docs-site")), []);
  assert.equal(quiet(() => main([engine])), 0);
});

test("fails on an engine copy that imports the theme", () => {
  const dir = copy();
  try {
    appendFileSync(join(dir, "src/index.ts"), '\nimport { x } from "../../theme/src/index.ts";\nimport "@velella/lateen";\nexport * from "../../../packages/theme/layouts/doc.ts";\n');
    assert.equal(rules(dir).filter((r) => r === "imports-theme").length, 3);
    assert.equal(quiet(() => main([dir])), 1);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("fails on the Lateen name, theme colors, and layout names in source", () => {
  const dir = copy();
  try {
    writeFileSync(join(dir, "src/leak.ts"), 'export const a = "Lateen";\nexport const b = "#1f1f28";\nexport const c = "kanagawa";\nexport const d = "landing";\n');
    assert.deepEqual(rules(dir).sort(), ["theme-color", "theme-name", "theme-name", "theme-product-name"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("allows the engine's own name and flags Lateen everywhere, README.md and package.json too", () => {
  const dir = copy();
  try {
    assert.deepEqual(scan(dir), []);
    mkdirSync(join(dir, "src/lib"));
    writeFileSync(join(dir, "src/lib/mizzen.ts"), 'export const name = "mizzen";\n');
    writeFileSync(join(dir, "src/lib/README.md"), "Mizzen, not Lateen\n");
    writeFileSync(join(dir, "src/lib/notes.json"), '{"theme":"lateen"}\n');
    assert.deepEqual(scan(dir).map((v) => v.file), ["src/lib/README.md", "src/lib/notes.json"]);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("does not flag words that merely contain a deny-listed name", () => {
  const dir = copy();
  try {
    writeFileSync(join(dir, "src/ok.ts"), 'export const northern = 1;\nexport const landings = 2;\n');
    assert.deepEqual(scan(dir), []);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test("fails on a missing directory", () => {
  assert.equal(quiet(() => main([join(tmpdir(), "no-such-engine-dir")])), 1);
});
