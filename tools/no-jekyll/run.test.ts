import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { root } from "../root.ts";
import { scan } from "./run.ts";

function tree(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), "slipway-no-jekyll-"));
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, name)), { recursive: true });
    writeFileSync(join(dir, name), content);
  }
  return dir;
}

function findings(files: Record<string, string>) {
  const dir = tree(files);
  try {
    return scan(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("a planted Ruby file fails", () => {
  const found = findings({ "packages/engine/src/legacy.rb": "puts 1\n" });
  assert.deepEqual(found.map((f) => [f.path, f.token]), [["packages/engine/src/legacy.rb", "Ruby/Liquid file"]]);
});

test("a planted Ruby file at the root fails", () => {
  assert.equal(findings({ "Gemfile": 'gem "jekyll"\n' }).length, 1);
});

test("a Liquid tag in content fails", () => {
  const found = findings({ "starter-files/page.md": "# Page\n{% include old.html %}\n" });
  assert.deepEqual(found.map((f) => [f.path, f.line, f.token]), [["starter-files/page.md", 2, "{%"]]);
});

test("Jekyll, Liquid, and remote_theme fail in code and config", () => {
  const found = findings({
    "packages/theme/src/theme.ts": 'export const build = "bundle exec jekyll build";\nexport const template = "liquid";\n',
    "site/mizzen.yml": "theme: liquid\nremote_theme: arminazimi/slipway\n",
  });
  assert.deepEqual(found.map((f) => [f.path, f.line, f.token]), [
    ["packages/theme/src/theme.ts", 1, "jekyll"],
    ["packages/theme/src/theme.ts", 2, "liquid"],
    ["site/mizzen.yml", 1, "liquid"],
    ["site/mizzen.yml", 2, "remote_theme"],
  ]);
});

test("comments and JSON descriptions are prose, not re-introductions", () => {
  const found = findings({
    "packages/engine/src/a.ts": "// Jekyll is gone\nexport const x = 1;\n",
    "schema/example.schema.json": '{\n  "description": "Jekyll mentioned in prose",\n  "type": "object"\n}\n',
  });
  assert.deepEqual(found, []);
});

test("allowed history, migration, and detection paths pass", () => {
  const found = findings({
    "docs/adr/0001-why.md": "Jekyll and Liquid\n{% raw %}\n",
    "CHANGELOG.md": "Jekyll\n",
    "changelog.d/1219.md": "Liquid\n",
    "UPGRADING.md": "remote_theme\n",
    "adapters/hugo/legacy.rb": 'gem "jekyll"\n',
    "tools/migrate/legacy.rb": "# Ruby\n",
    "site/guides/migration.md": "Jekyll\n{% raw %}\n",
    "packages/doctor/src/checks/jekyll.ts": 'export const id = "jekyll.liquid";\n',
    "packages/doctor/test/fixtures/old/_layouts/default.html": "{% include head.html %}\n",
    "packages/engine/src/a.test.ts": 'test("Jekyll", () => {});\n',
  });
  assert.deepEqual(found, []);
});

test("legacy site prose is out of scope, but site config and code are still scanned", () => {
  const found = findings({
    "site/blocks/index.md": "{% include blocks/x.html %}\n",
    "site/_data/navigation.yml": "title: Jekyll\n",
    // A Ruby file is never prose, even under a legacy content folder.
    "site/_data/legacy.rb": "puts 1\n",
    // A config file in the same legacy site is not prose.
    "site/mizzen.yml": "plugins:\n  - jekyll-remote-theme\n",
  });
  assert.deepEqual(found.map((f) => [f.path, f.token]), [
    ["site/_data/legacy.rb", "Ruby/Liquid file"],
    ["site/mizzen.yml", "jekyll"],
  ]);
});

test("the real repository passes", () => {
  assert.deepEqual(scan(root), []);
});
