import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { movePage } from "../src/tools/move_page.mjs";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const testDir = join(root, ".tmp/test-move-page");

before(() => {
  rmSync(testDir, { recursive: true, force: true });
  cpSync(join(root, "examples/docs"), testDir, { recursive: true });

  mkdirSync(join(testDir, "notes"), { recursive: true });
  writeFileSync(join(testDir, "notes/a.md"), "---\ntitle: A note\n---\n\n# A note\n");
  writeFileSync(
    join(testDir, "notes/b.md"),
    "---\ntitle: Another note\n---\n\nSee [A](/notes/a.html#top) and [A again](a.md).\n",
  );
  writeFileSync(
    join(testDir, "_data/navigation.yml"),
    [
      "# yaml-language-server: $schema=../../../schema/navigation.schema.json",
      "main:",
      "  - title: Home",
      "    url: /",
      "  - title: A note",
      "    url: /notes/a.html",
      "",
    ].join("\n"),
  );
});

after(() => {
  rmSync(testDir, { recursive: true, force: true });
});

test("a moved page keeps its old URL and the links to it", () => {
  const result = movePage(testDir, { from: "notes/a.md", to: "notes/renamed.md" });

  assert.deepEqual(result.moved, { from: "notes/a.md", to: "notes/renamed.md" });
  assert.deepEqual(result.redirect_from, ["/notes/a.html"]);
  assert.ok(existsSync(join(testDir, "notes/renamed.md")), "the new file exists");
  assert.ok(!existsSync(join(testDir, "notes/a.md")), "the old file is gone");

  const moved = readFileSync(join(testDir, "notes/renamed.md"), "utf8");
  assert.match(moved, /redirect_from:/);
  assert.match(moved, /- \/notes\/a\.html/);
  assert.match(moved, /# A note/, "the body is kept");

  const links = readFileSync(join(testDir, "notes/b.md"), "utf8");
  assert.match(links, /\[A\]\(\/notes\/renamed\.html#top\)/);
  assert.match(links, /\[A again\]\(renamed\.md\)/);

  const navigation = readFileSync(join(testDir, "_data/navigation.yml"), "utf8");
  assert.match(navigation, /url: \/notes\/renamed\.html/);

  const files = result.changed.map((entry) => entry.file).sort();
  assert.deepEqual(files, ["_data/navigation.yml", "notes/b.md", "notes/renamed.md"]);
  for (const entry of result.changed) assert.ok(entry.line > 0, `${entry.file} reports a line`);
});

test("a page with a permalink keeps its URL, so nothing points at the old path", () => {
  const result = movePage(testDir, { from: "guide/write.md", to: "guide/author.md" });
  assert.deepEqual(result.redirect_from, []);
  assert.deepEqual(result.changed, [{ file: "guide/author.md" }]);
  assert.doesNotMatch(readFileSync(join(testDir, "guide/author.md"), "utf8"), /redirect_from/);
});

test("an existing redirect_from list grows instead of being replaced", () => {
  writeFileSync(
    join(testDir, "notes/c.md"),
    "---\ntitle: C\nredirect_from:\n  - /old-c.html\n---\n\n# C\n",
  );
  movePage(testDir, { from: "notes/c.md", to: "notes/d.md" });
  const moved = readFileSync(join(testDir, "notes/d.md"), "utf8");
  assert.match(moved, /- \/old-c\.html/);
  assert.match(moved, /- \/notes\/c\.html/);
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
