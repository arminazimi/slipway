import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { movePage } from "../src/tools/move_page.ts";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const fixture = join(root, "fixtures/docs-site");
const testDir = join(root, ".tmp/test-move-page");

before(() => {
  rmSync(testDir, { recursive: true, force: true });
  cpSync(fixture, testDir, { recursive: true });

  writeFileSync(join(testDir, "mizzen.yml"), ["title: Beacon", "base: /beacon", "lang: en", ""].join("\n"));

  mkdirSync(join(testDir, "notes"), { recursive: true });
  writeFileSync(join(testDir, "notes/a.md"), "---\ntitle: A note\n---\n\n# A note\n");
  writeFileSync(
    join(testDir, "notes/b.md"),
    "---\ntitle: Another note\n---\n\nSee [A](/notes/a/#top), [A again](a.md), and [A with base](/beacon/notes/a/).\n",
  );
  writeFileSync(
    join(testDir, "_data/navigation.yml"),
    [
      "main:",
      "  - title: Home",
      "    url: /",
      "  - title: Notes",
      "    children:",
      "      - title: A note",
      "        url: /notes/a/",
      "",
    ].join("\n"),
  );
});

after(() => {
  rmSync(testDir, { recursive: true, force: true });
});

test("a moved page keeps its old URL and updates navigation and links", () => {
  const result = movePage(testDir, { from: "notes/a.md", to: "notes/renamed.md" });

  assert.deepEqual(result.moved, { from: "notes/a.md", to: "notes/renamed.md" });
  assert.deepEqual(result.redirect_from, ["/notes/a/"], "the old URL is written without the site base");
  assert.ok(existsSync(join(testDir, "notes/renamed.md")), "the new file exists");
  assert.ok(!existsSync(join(testDir, "notes/a.md")), "the old file is gone");

  const moved = readFileSync(join(testDir, "notes/renamed.md"), "utf8");
  assert.match(moved, /redirect_from:/);
  assert.match(moved, /- \/notes\/a\//);
  assert.match(moved, /# A note/, "the body is kept");

  const links = readFileSync(join(testDir, "notes/b.md"), "utf8");
  assert.match(links, /\[A\]\(\/notes\/renamed\/#top\)/);
  assert.match(links, /\[A again\]\(renamed.md\)/);
  assert.match(links, /\[A with base\]\(\/beacon\/notes\/renamed\/\)/);

  const navigation = readFileSync(join(testDir, "_data/navigation.yml"), "utf8");
  assert.match(navigation, /url: \/notes\/renamed\//);
  assert.match(navigation, /  children:\n/, "the YAML keeps its shape");

  const files = result.changed.map((entry) => entry.file).sort();
  assert.deepEqual(files, ["_data/navigation.yml", "notes/b.md", "notes/renamed.md"]);
  assert.deepEqual(result.files, ["_data/navigation.yml", "notes/b.md", "notes/renamed.md"], "the changed files are sorted");
  for (const entry of result.changed) assert.ok(entry.line !== undefined && entry.line > 0, `${entry.file} reports a line`);
});

test("a page with a permalink keeps its URL, so nothing points at the old path", () => {
  const result = movePage(testDir, { from: "404.md", to: "not-found.md" });
  assert.deepEqual(result.redirect_from, []);
  assert.deepEqual(result.files, ["not-found.md"]);
  assert.deepEqual(result.changed, [{ file: "not-found.md" }]);
  assert.doesNotMatch(readFileSync(join(testDir, "not-found.md"), "utf8"), /redirect_from/);
});

test("an existing redirect_from list grows instead of being replaced", () => {
  writeFileSync(
    join(testDir, "notes/c.md"),
    "---\ntitle: C\nredirect_from:\n  - /old-c.html\n---\n\n# C\n",
  );
  movePage(testDir, { from: "notes/c.md", to: "notes/d.md" });
  const moved = readFileSync(join(testDir, "notes/d.md"), "utf8");
  assert.match(moved, /- \/old-c\.html/);
  assert.match(moved, /- \/notes\/c\//);
});

test("imported navigation with a language suffix is updated too", () => {
  writeFileSync(
    join(testDir, "_data/navigation.yml"),
    ["docs_fa:", "  - title: نصب", "    url: /install/", ""].join("\n"),
  );
  const result = movePage(testDir, { from: "install.md", to: "setup.md" });
  assert.deepEqual(result.redirect_from, ["/install/"]);
  assert.match(readFileSync(join(testDir, "_data/navigation.yml"), "utf8"), /url: \/setup\//);
});

test("bad input names the problem", () => {
  assert.throws(() => movePage(testDir, { from: "notes/missing.md", to: "notes/x.md" }), /does not exist/);
  assert.throws(() => movePage(testDir, { from: "notes/d.md", to: "notes/b.md" }), /already exists/);
  assert.throws(() => movePage(testDir, { from: "notes/d.md", to: "notes/d.html" }), /must end with \.md/);
  assert.throws(() => movePage(testDir, { from: "notes/d.md", to: "notes/d.md" }), /the same page/);
});

test("a path outside the site is refused", () => {
  assert.throws(() => movePage(testDir, { from: "../outside.md", to: "notes/x.md" }), /outside the site directory/);
  assert.throws(() => movePage(testDir, { from: "notes/d.md", to: "../outside.md" }), /outside the site directory/);
});
