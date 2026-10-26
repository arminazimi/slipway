// Builds the fixture site with the Astro adapter and checks what it writes with slipway doctor.
// The build tests need Astro 3: set ASTRO_MODULES to a node_modules folder holding
// @astro/core, @astro/preset-classic, react, and react-dom. They skip without it; CI installs them.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { doctor } from "../../../packages/doctor/src/doctor.mjs";
import { validateSourcemap } from "../../../tools/theme/sourcemap.mjs";
import { twinOf, twinUrl } from "../src/index.mjs";
import { headingsIn, lineOffset, linksIn } from "../src/markdown.mjs";

const adapter = fileURLToPath(new URL("..", import.meta.url));
const fixture = fileURLToPath(new URL("site", import.meta.url));
const modules = process.env.ASTRO_MODULES;
const cli = modules && join(modules, "astro/astro.js");
const skip = cli && existsSync(cli) ? false : "set ASTRO_MODULES to a node_modules folder with Astro to run it";

let built = null;
/** Copies the fixture and the starter files into a temporary folder and builds it once for every test. */
function build() {
  if (built) return built;
  const dir = mkdtempSync(join(tmpdir(), "slipway-astro-"));
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  cpSync(fixture, dir, { recursive: true });
  cpSync(join(adapter, "starter"), dir, { recursive: true });
  symlinkSync(modules, join(dir, "node_modules"), "dir");
  // No persistent cache: it lives in the shared node_modules and would hide a change to the adapter.
  const env = { ...process.env, SLIPWAY_ASTRO: adapter, ASTRO_NO_PERSISTENT_CACHE: "1" };
  const result = spawnSync(process.execPath, [cli, "build"], { cwd: dir, env, encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr + result.stdout);
  return (built = dir);
}

const read = (dir, path) => readFileSync(join(dir, path), "utf8");
const page = (map, url) => map.pages.find((p) => p.url === url);

test("the fixture with the starter files reaches L2 with no errors", { skip }, async () => {
  const dir = build();
  const report = await doctor(dir, { build: join(dir, "dist") });
  // L3 needs the agent-skills index, which this adapter does not write.
  const l3 = new Set(report.tests.filter((r) => r.level === "L3").map((r) => r.id));
  assert.deepEqual(report.findings.filter((f) => f.severity === "error" && !l3.has(f.id)), []);
  assert.equal(report.generator, "astro");
  assert.equal(report.level, "L2");
});
