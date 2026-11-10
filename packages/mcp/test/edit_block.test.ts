import assert from "node:assert/strict";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { hashSource } from "../../engine/src/edits/patch.ts";
import { editBlock } from "../src/tools/edit_block.ts";

const fixture = fileURLToPath(new URL("../../../fixtures/docs-site", import.meta.url));

/** A copy of fixtures/docs-site without its build cache, removed when the test ends. */
function siteWithPages(t) {
  const site = mkdtempSync(join(tmpdir(), "slipway-edit-block-"));
  t.after(() => rmSync(site, { recursive: true, force: true }));
  cpSync(fixture, site, { recursive: true, filter: (path) => !path.split(sep).includes(".slipway") });
  return site;
}

test("edits a paragraph and keeps every other block of the page", async (t) => {
  const site = siteWithPages(t);
  const file = join(site, "install.md");
  const source = readFileSync(file, "utf8");
  const markdown = "Beacon ships as one binary for Linux, macOS, and Windows.";

  const result = await editBlock(site, { block: "install.md:9:1", markdown, hash: hashSource(source) });

  assert.equal(result.file, "install.md");
  assert.equal(result.block, "install.md:9:1");
  assert.equal(result.oldSpan, "install.md:9:1-9:98");
  assert.equal(result.newSpan, `install.md:9:1-9:${markdown.length}`);
  assert.equal(result.hash, hashSource(readFileSync(file, "utf8")));
  assert.match(result.diff, /^-Beacon ships as a single binary\. Pick the one that matches your machine and put it on your `PATH`\.$/m);
  assert.match(result.diff, new RegExp(`^\\+${markdown.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "m"));

  const after = readFileSync(file, "utf8");
  assert.equal(
    after,
    source.replace(
      "Beacon ships as a single binary. Pick the one that matches your machine and put it on your `PATH`.",
      markdown,
    ),
  );
  assert.ok(after.includes("## With a package manager"), "the next section is untouched");
});

test("edits a table and shifts the blocks below it without changing them", async (t) => {
  const site = siteWithPages(t);
  const file = join(site, "commands.md");
  const source = readFileSync(file, "utf8");
  const lines = [
    "| Command | What it does |",
    "| --- | --- |",
    "| `beacon init` | writes `beacon.yml` |",
    "| `beacon check` | validates the config |",
  ];
  const markdown = lines.join("\n");

  const result = await editBlock(site, { block: "commands.md:5:1", markdown, hash: hashSource(source) });

  assert.equal(result.oldSpan, "commands.md:5:1-12:57");
  assert.equal(result.newSpan, `commands.md:5:1-8:${lines[lines.length - 1]!.length}`);
  assert.equal(
    readFileSync(file, "utf8"),
    source.replace("| Command | What it does |\n| --- | --- |\n| `beacon init` | writes `beacon.yml` |\n| `beacon build` | runs the build command |\n| `beacon deploy` | uploads an artifact and points the environment at it |\n| `beacon releases` | lists the last artifacts |\n| `beacon rollback` | points an environment at an older artifact |\n| `beacon status` | prints what each environment serves |", markdown),
  );
  assert.ok(readFileSync(file, "utf8").includes("## Flags"), "the section below the table survives the edit");
});

test("edits one list item of a loose list and leaves its siblings alone", async (t) => {
  const site = siteWithPages(t);
  const file = join(site, "loose.md");
  const source = "# Loose\n\n- First item,\n  on two lines.\n\n- Second item.\n";
  writeFileSync(file, source);

  const result = await editBlock(site, {
    block: "loose.md:6:3",
    markdown: "Second item, revised.",
    hash: hashSource(source),
  });

  assert.equal(result.oldSpan, "loose.md:6:3-6:14");
  assert.equal(result.newSpan, "loose.md:6:3-6:23");
  assert.equal(readFileSync(file, "utf8"), source.replace("Second item.", "Second item, revised."));
});

test("a stale hash is refused and the page is left byte-identical", async (t) => {
  const site = siteWithPages(t);
  const file = join(site, "install.md");
  const source = readFileSync(file, "utf8");

  await assert.rejects(
    editBlock(site, { block: "install.md:9:1", markdown: "Replaced.", hash: "0".repeat(64) }),
    /hashes to [0-9a-f]{64}, not 0{64}: the page changed since it was read, so nothing was written/,
  );
  assert.equal(readFileSync(file, "utf8"), source);
});

test("an edit that adds a block is refused and nothing is written", async (t) => {
  const site = siteWithPages(t);
  const file = join(site, "install.md");
  const source = readFileSync(file, "utf8");

  await assert.rejects(
    editBlock(site, {
      block: "install.md:9:1",
      markdown: "One paragraph.\n\nA second paragraph.",
      hash: hashSource(source),
    }),
    /changed content outside the block at install\.md:9:1, so nothing was written/,
  );
  assert.equal(readFileSync(file, "utf8"), source);
});

test("an unknown block ID is refused", async (t) => {
  const site = siteWithPages(t);
  const source = readFileSync(join(site, "install.md"), "utf8");

  await assert.rejects(
    editBlock(site, { block: "install.md:99:1", markdown: "Replaced.", hash: hashSource(source) }),
    /no block at install\.md:99:1 in install\.md/,
  );
  await assert.rejects(
    editBlock(site, { block: "install.md", markdown: "Replaced.", hash: hashSource(source) }),
    /is not a block ID/,
  );
});
