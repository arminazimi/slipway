import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, test } from "node:test";
import { readConfig } from "../src/tools/read_config.ts";

const site = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));

const tmpSites = [];
function siteWith(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), "read-config-"));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(root, name), text);
  tmpSites.push(root);
  return root;
}
afterEach(() => {
  while (tmpSites.length > 0) rmSync(tmpSites.pop(), { recursive: true, force: true });
});

test("read_config returns the validated slipway.yml of fixtures/docs-site", () => {
  const { file, valid, diagnostics, config } = readConfig(site, "slipway.yml");
  assert.equal(file, "slipway.yml");
  assert.equal(valid, true);
  assert.deepEqual(diagnostics, []);
  assert.equal(config.title, "Beacon");
  assert.equal(config.lang, "en");
  assert.equal(config.navigation, "_data/navigation.yml");
  assert.deepEqual(config.repository, { url: "https://github.com/example/beacon-docs", branch: "main", dir: "" });
});

test("the default file is the engine's mizzen.yml", () => {
  const root = siteWith({ "mizzen.yml": "title: T\n" });
  const { file, valid, config } = readConfig(root);
  assert.equal(file, "mizzen.yml");
  assert.equal(valid, true);
  assert.equal(config.title, "T");
});

test("invalid YAML comes back as a config.invalid-yaml diagnostic that names the line", () => {
  const root = siteWith({ "broken.yml": "title: T\nsparkle: [\n" });
  const { valid, diagnostics } = readConfig(root, "broken.yml");
  assert.equal(valid, false);
  assert.equal(diagnostics[0].id, "config.invalid-yaml");
  assert.equal(diagnostics[0].pos.file, "broken.yml");
  assert.ok(diagnostics[0].pos.line >= 2);
});

test("a wrong key and a wrong value come back as diagnostics", () => {
  const unknown = readConfig(siteWith({ "mizzen.yml": "sparkle: true\n" }));
  assert.equal(unknown.valid, false);
  assert.equal(unknown.diagnostics[0].id, "config.unknown-key");
  assert.match(unknown.diagnostics[0].message, /sparkle/);

  const invalid = readConfig(siteWith({ "mizzen.yml": "title: 3\n" }));
  assert.equal(invalid.valid, false);
  assert.equal(invalid.diagnostics[0].id, "config.invalid");
});

test("a non-YAML file, a missing file, and a path outside the site are tool errors", () => {
  assert.throws(() => readConfig(site, "index.md"), /not a YAML config file/);
  assert.throws(() => readConfig(site, "missing.yml"), /does not exist in the site/);
  assert.throws(() => readConfig(site, "../slipway.yml"), /outside the site directory/);
});
