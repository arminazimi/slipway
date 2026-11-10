// Tests for the deterministic gate (issues #1148, #1572): two builds of the same fixture must write the same bytes,
// both see the fixed SOURCE_DATE_EPOCH, the first differing file is named with its byte offset, and every allowance is
// printed while a stale one fails. The engine is deterministic, so most tests use a recording builder to stand in for a
// broken build; one test builds the real `fixtures/docs-site`.
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import type { BuildOptions, BuildResult } from "../../packages/engine/src/pipeline/build.ts";
import { resetFixtureBuilds, type FixtureBuilder, type FixtureName } from "../fixture-build/build.ts";
import {
  allowedMessages,
  DEFAULT_ALLOW_FILE,
  deterministic,
  differenceMessage,
  firstDifference,
  parseArguments,
  SOURCE_DATE_EPOCH,
  staleMessages,
} from "./run.ts";

/** A stand-in repository: the fixtures, the engine, the theme, and the lockfile the shared helper hashes. */
function fixtureRoot(t: { after: (fn: () => void) => void }, files: Record<string, string> = {}): string {
  const repo = mkdtempSync(join(tmpdir(), "slipway-deterministic-"));
  t.after(() => {
    resetFixtureBuilds();
    rmSync(repo, { recursive: true, force: true });
  });
  const defaults = {
    "fixtures/docs-site/index.md": "# Docs\n",
    "fixtures/rtl-site/index.md": "# راهنما\n",
    "packages/engine/src/index.ts": "export const version = 1;\n",
    "packages/theme/src/index.ts": "export const name = 'theme';\n",
    "package-lock.json": "{}\n",
  };
  for (const [path, text] of Object.entries({ ...defaults, ...files })) {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), text);
  }
  return repo;
}

/** A builder that writes the files `write` returns and records what each call saw. */
function writer(
  write: (options: BuildOptions, call: number) => Record<string, string>,
): { calls: BuildOptions[]; build: FixtureBuilder } {
  const calls: BuildOptions[] = [];
  const build: FixtureBuilder = async (options) => {
    calls.push(options);
    const files = write(options, calls.length);
    mkdirSync(options.out, { recursive: true });
    for (const [path, text] of Object.entries(files)) {
      mkdirSync(dirname(join(options.out, path)), { recursive: true });
      writeFileSync(join(options.out, path), text);
    }
    const result: BuildResult = { out: options.out, files: Object.keys(files), diagnostics: [] };
    return result;
  };
  return { calls, build };
}

test("passes when two builds write the same bytes and both see the fixed epoch", async (t) => {
  const root = fixtureRoot(t);
  const previous = process.env.SOURCE_DATE_EPOCH;
  const epochs: (string | undefined)[] = [];
  const { calls, build } = writer(() => {
    epochs.push(process.env.SOURCE_DATE_EPOCH);
    return { "index.html": "same\n", "guide/install.html": "same\n" };
  });

  const result = await deterministic({ root, fixtures: ["docs-site"], workDir: join(root, "work"), build });

  assert.deepEqual(result, {
    kind: "identical",
    fixtures: ["docs-site"],
    allowed: [],
    stale: [],
  });
  assert.equal(calls.length, 2, "one build per output folder");
  assert.notEqual(calls[0]!.out, calls[1]!.out, "the two builds write in different folders");
  assert.deepEqual(epochs, [SOURCE_DATE_EPOCH, SOURCE_DATE_EPOCH], "the second build gets the fixed epoch too");
  assert.equal(process.env.SOURCE_DATE_EPOCH, previous, "the environment is put back");
  assert.deepEqual(readdirSync(join(root, "work")), [], "the two scratch folders are removed");
});

test("fails on a build whose content differs and names the first file and byte offset", async (t) => {
  const root = fixtureRoot(t);
  const { build } = writer((_options, call) => ({
    "about/index.html": call === 1 ? "first\n" : "second\n",
    "index.html": call === 1 ? "first\n" : "second\n",
  }));

  const result = await deterministic({ root, fixtures: ["docs-site"], workDir: join(root, "work"), build });

  assert.equal(result.kind, "differs");
  if (result.kind !== "differs") return;
  assert.equal(result.fixture, "docs-site");
  assert.deepEqual(
    result.difference,
    { path: "about/index.html", kind: "changed", offset: 0 },
    "the first path, not the first written",
  );
  assert.equal(
    differenceMessage(result.fixture, result.difference),
    "deterministic: fixtures/docs-site/about/index.html: differs between two builds at byte offset 0 (zero-based).",
  );
});

test("names a file that only one build writes", async (t) => {
  const root = fixtureRoot(t);
  const { build } = writer((_options, call) =>
    call === 2 ? { "extra.txt": "only here\n", "index.html": "same\n" } : { "index.html": "same\n" },
  );

  const result = await deterministic({ root, fixtures: ["docs-site"], workDir: join(root, "work"), build });

  assert.equal(result.kind, "differs");
  if (result.kind !== "differs") return;
  assert.deepEqual(
    result.difference,
    { path: "extra.txt", kind: "only-in-second" },
    "a file only one build writes has no byte offset",
  );
  assert.equal(
    differenceMessage(result.fixture, result.difference),
    "deterministic: fixtures/docs-site/extra.txt: is written by the second build only.",
  );
});

test("firstDifference compares nested files in path order", async (t) => {
  const root = fixtureRoot(t);
  const first = join(root, "first");
  const second = join(root, "second");
  for (const dir of [first, second]) mkdirSync(join(dir, "a"), { recursive: true });
  writeFileSync(join(first, "a/b.html"), "same\n");
  writeFileSync(join(second, "a/b.html"), "same\n");
  writeFileSync(join(first, "z.html"), "same\n");
  writeFileSync(join(second, "z.html"), "same\n");
  assert.equal(await firstDifference(first, second), undefined);

  writeFileSync(join(second, "a/b.html"), "different\n");
  writeFileSync(join(second, "z.html"), "different too\n");
  assert.deepEqual(await firstDifference(first, second), { path: "a/b.html", kind: "changed", offset: 0 });

  rmSync(join(second, "a/b.html"));
  assert.deepEqual(await firstDifference(first, second), { path: "a/b.html", kind: "only-in-first" });

  writeFileSync(join(second, "a/b.html"), "same\n");
  writeFileSync(join(second, "new.txt"), "new\n");
  assert.deepEqual(await firstDifference(first, second), { path: "new.txt", kind: "only-in-second" });
});

test("firstDifference reports the zero-based byte offset of the first differing byte", async (t) => {
  const root = fixtureRoot(t);
  const first = join(root, "first");
  const second = join(root, "second");
  mkdirSync(first);
  mkdirSync(second);
  writeFileSync(join(first, "index.html"), "abcdef\n");
  writeFileSync(join(second, "index.html"), "abcXef\n");
  assert.deepEqual(await firstDifference(first, second), { path: "index.html", kind: "changed", offset: 3 });

  writeFileSync(join(second, "index.html"), "abc");
  assert.deepEqual(
    await firstDifference(first, second),
    { path: "index.html", kind: "changed", offset: 3 },
    "a prefix differs at the shorter length",
  );

  rmSync(join(first, "index.html"));
  rmSync(join(second, "index.html"));
  writeFileSync(join(first, "utf8.html"), "é\n");
  writeFileSync(join(second, "utf8.html"), "è\n");
  assert.deepEqual(
    await firstDifference(first, second),
    { path: "utf8.html", kind: "changed", offset: 1 },
    "the offset counts bytes, not characters",
  );
});

test("a difference an allow entry covers is printed, never silently ignored", async (t) => {
  const root = fixtureRoot(t, {
    [DEFAULT_ALLOW_FILE]: "# a known gap\n\nfixtures/docs-site/index.html\n",
  });
  const { build } = writer((_options, call) => ({ "index.html": call === 1 ? "one\n" : "two\n" }));

  const result = await deterministic({ root, fixtures: ["docs-site"], workDir: join(root, "work"), build });

  assert.equal(result.kind, "identical");
  assert.equal(result.allowFile, DEFAULT_ALLOW_FILE);
  assert.deepEqual(result.allowed, [
    { fixture: "docs-site", difference: { path: "index.html", kind: "changed", offset: 0 } },
  ]);
  assert.deepEqual(result.stale, [], "an entry that matched is not stale");

  const lines = allowedMessages(result.allowed, result.allowFile);
  assert.deepEqual(lines, [
    `deterministic: allowed by ${DEFAULT_ALLOW_FILE}: fixtures/docs-site/index.html ` +
      "differs between two builds at byte offset 0 (zero-based).",
  ]);
});

test("an allow entry that matches no difference is reported as stale", async (t) => {
  const root = fixtureRoot(t, {
    [DEFAULT_ALLOW_FILE]: [
      "# no longer true",
      "fixtures/docs-site/gone.html",
      "fixtures/rtl-site/gone.html",
      "",
    ].join("\n"),
  });
  const { build } = writer(() => ({ "index.html": "same\n" }));

  const result = await deterministic({ root, fixtures: ["docs-site"], workDir: join(root, "work"), build });

  assert.equal(result.kind, "stale");
  assert.deepEqual(
    result.stale,
    ["fixtures/docs-site/gone.html"],
    "an entry for a fixture this run did not check is not called stale",
  );
  assert.deepEqual(result.allowed, []);
  assert.deepEqual(staleMessages(result.stale, result.allowFile), [
    `deterministic: stale allow entry in ${DEFAULT_ALLOW_FILE}: fixtures/docs-site/gone.html matches no difference; remove it.`,
  ]);
});

test("an explicitly named allow file must exist", async (t) => {
  const root = fixtureRoot(t);
  await assert.rejects(
    deterministic({
      root,
      fixtures: ["docs-site"],
      workDir: join(root, "work"),
      allowFile: "missing-allow.txt",
    }),
    /allow file not found/,
  );
});

test("the command line reads --allow <file> and --allow=<file>", () => {
  assert.deepEqual(parseArguments([]), { kind: "run", fixtures: ["docs-site", "rtl-site"] });
  assert.deepEqual(parseArguments(["--allow", "list.txt", "docs-site"]), {
    kind: "run",
    fixtures: ["docs-site"],
    allowFile: "list.txt",
  });
  assert.deepEqual(parseArguments(["--allow=list.txt"]), {
    kind: "run",
    fixtures: ["docs-site", "rtl-site"],
    allowFile: "list.txt",
  });
  assert.equal(parseArguments(["--allow"]).kind, "error");
  assert.equal(parseArguments(["--allow", "--help"]).kind, "error");
  assert.equal(parseArguments(["--allow=a.txt", "--allow=b.txt"]).kind, "error");
  assert.equal(parseArguments(["--unknown"]).kind, "error");
});

test("rejects a fixture the shared helper does not know", async () => {
  await assert.rejects(
    deterministic({ fixtures: ["unknown-site" as FixtureName], root: tmpdir() }),
    /unknown fixture "unknown-site"/,
  );
});

test("passes on fixtures/docs-site", async (t) => {
  t.after(resetFixtureBuilds);
  const work = mkdtempSync(join(tmpdir(), "slipway-deterministic-real-"));
  t.after(() => rmSync(work, { recursive: true, force: true }));

  const result = await deterministic({ fixtures: ["docs-site"], workDir: work });
  assert.equal(result.kind, "identical");
  assert.deepEqual(result.fixtures, ["docs-site"]);
  assert.deepEqual(result.allowed, []);
  assert.deepEqual(result.stale, []);
});
