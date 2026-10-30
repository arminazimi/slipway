import assert from "node:assert/strict";
import { cpSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { bundleAvailable, buildExample } from "../theme/build.mjs";
import { root } from "../theme/tokens.mjs";
import { tmpDir } from "../theme/tmp.mjs";
import { collect, key, region, render } from "./sync.mjs";

const fixture = join(root, "tools/snippets/fixtures/site");
const skip = bundleAvailable() ? false : "run `bundle install` to build with the GitHub Pages gem";

function site(name) {
  const dir = tmpDir(name);
  cpSync(fixture, dir, { recursive: true });
  return dir;
}

function sync(dir, check) {
  return spawnSync(process.execPath, [join(root, "tools/snippets/sync.mjs"), dir, ...(check ? ["--check"] : [])], { encoding: "utf8" });
}

test("a region is the lines between its markers, for any comment style", () => {
  const slash = "a\n// region setup\none\ntwo\n// endregion\nb";
  assert.deepEqual(region(slash, "setup"), { line: 3, lines: ["one", "two"] });
  assert.deepEqual(region("// region setup\n# endregion", "setup"), { line: 2, lines: [] });
  assert.deepEqual(region("<!-- region setup -->\n<p>x</p>\n<!-- endregion -->", "setup"), { line: 2, lines: ["<p>x</p>"] });
  assert.deepEqual(region("# region setup\nx\n# endregion", "other"), null);
  assert.deepEqual(region("// region setup\nx", "setup"), { error: "region has no endregion" });
});

test("collect fails with the file and the region name when a region is gone", () => {
  const dir = site("snippets-missing");
  writeFileSync(join(dir, "src/app.ts"), "export {};\n");
  assert.throws(() => collect(dir), /no region setup in src\/app\.ts/);
  rmSync(dir, { recursive: true, force: true });
});

test("the key is the same in JavaScript and Liquid", () => {
  assert.equal(key("src/app.ts", "setup"), "src-app-ts--setup");
  assert.equal(key("a.b/C_d.py", "Main Part"), "a-b-c-d-py--main-part");
});

test("the rendered page prints the region and its source line", { skip }, () => {
  const dir = site("snippets-site");
  const run = sync(dir);
  assert.equal(run.status, 0, run.stderr);
  assert.match(readFileSync(join(dir, "_data/snippets.json"), "utf8"), /"line": 3/);

  const out = buildExample("gem", tmpDir("snippets-out"), dir);
  const html = readFileSync(join(out, "index.html"), "utf8");
  assert.match(html, /<code class="language-ts">/);
  assert.match(html, /console\.log\(`Listening on \$\{port\}`\);/);
  assert.match(html, /src\/app\.ts:3/);
  assert.doesNotMatch(html, /region setup/);
  rmSync(dir, { recursive: true, force: true });
});

test("--check fails when the copies are stale", () => {
  const dir = site("snippets-stale");
  assert.equal(sync(dir).status, 0);
  const file = join(dir, "_data/snippets.json");
  writeFileSync(file, render({}));
  const run = sync(dir, true);
  assert.equal(run.status, 1);
  assert.match(run.stderr, /is stale/);
  assert.equal(sync(dir, false).status, 0);
  assert.equal(sync(dir, true).status, 0);
  rmSync(dir, { recursive: true, force: true });
});
