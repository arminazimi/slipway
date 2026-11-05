// The card budget (`og.budget`): every card the Actions plugin draws fits in 100 KB, so a shared
// link's preview picture downloads as fast as the page behind it. The fixture site builds with the
// plugin copied in, the way an Actions-mode site ships it; a second test proves the check names an
// oversized card instead of passing it.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { bundleAvailable, root } from "../theme/build.mjs";

const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";
const fixture = join(root, "tools/theme/fixtures/og-site");
const folder = join("assets", "images", "og");
export const budget = 100 * 1024;
const work = mkdtempSync(join(tmpdir(), "slipway-og-budget-"));
after(() => rmSync(work, { recursive: true, force: true }));

/** Every PNG the plugin wrote, as its path from the output folder and its size in bytes, sorted. */
export function cards(dir) {
  return readdirSync(join(dir, folder), { recursive: true })
    .filter((path) => path.endsWith(".png"))
    .map((path) => ({ file: `${folder}/${path}`, bytes: readFileSync(join(dir, folder, path)).length }))
    .sort((a, b) => a.file.localeCompare(b.file));
}

/** The cards over the budget, each named like `assets/images/og/index.png (204800 bytes)`. */
export function overBudget(found, limit = budget) {
  return found.filter((card) => card.bytes > limit).map((card) => `${card.file} (${card.bytes} bytes)`);
}

function build() {
  const site = join(work, "site");
  cpSync(fixture, site, { recursive: true });
  cpSync(join(root, "_plugins"), join(site, "_plugins"), { recursive: true });
  const out = join(work, "out");
  // Without the GitHub Pages gem's overrides, as in an Actions build: not safe, _plugins loaded.
  const result = spawnSync("bundle", ["exec", "jekyll", "build", "--source", site, "--destination", out, "--baseurl", ""], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, PAGES_REPO_NWO: "arminazimi/slipway", JEKYLL_NO_BUNDLER_REQUIRE: "1" },
  });
  assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  return out;
}

test("every card of the fixture site stays under 100 KB", { skip }, () => {
  const out = build();
  const found = cards(out);
  assert.ok(found.length >= 3, `expected the generated cards, found ${JSON.stringify(found)}`);
  assert.deepEqual(overBudget(found), []);
});

test("the check names each card over the budget and leaves the rest alone", () => {
  const dir = join(work, "budget");
  mkdirSync(join(dir, folder), { recursive: true });
  writeFileSync(join(dir, folder, "big.png"), Buffer.alloc(budget + 1));
  writeFileSync(join(dir, folder, "exact.png"), Buffer.alloc(budget));
  writeFileSync(join(dir, folder, "small.png"), Buffer.alloc(16));
  assert.deepEqual(overBudget(cards(dir)), [`${folder}/big.png (${budget + 1} bytes)`]);
  assert.deepEqual(cards(dir).map((card) => card.file), [`${folder}/big.png`, `${folder}/exact.png`, `${folder}/small.png`]);
  assert.deepEqual(overBudget([], 0), []);
});
